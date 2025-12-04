import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const prismaAny = prisma as any;

// GET /api/projects?email=...&userId=...
// يرجّع المشاريع اللي:
//  - accountEmail = email
//  - أو المستخدم عضو فيها عن طريق ProjectMember
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    let where: any = {};

    if (email || userId) {
      const or: any[] = [];
      if (email) {
        or.push({ accountEmail: email });
      }
      if (userId) {
        or.push({
          members: {
            some: { userId },
          },
        });
      }

      if (or.length === 1) {
        where = or[0];
      } else if (or.length > 1) {
        where = { OR: or };
      }
    }

    const projects = await prismaAny.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "خطأ في تحميل المشاريع" },
      { status: 500 }
    );
  }
}

// POST /api/projects
// إنشاء مشروع جديد + إضافة منشئ المشروع كعضو في ProjectMember
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      name,
      ownerName,
      contractorName,
      consultantName,
      status,
      accountEmail,
      currentUserId,
    } = body;

    if (!code || !name || !ownerName || !contractorName) {
      return NextResponse.json(
        { error: "الحقول الأساسية للمشروع مطلوبة" },
        { status: 400 }
      );
    }

    if (!accountEmail || !currentUserId) {
      return NextResponse.json(
        { error: "بيانات المستخدم غير مكتملة" },
        { status: 400 }
      );
    }

    // إنشاء المشروع
    const project = await prismaAny.project.create({
      data: {
        code,
        name,
        ownerName,
        contractorName,
        consultantName: consultantName ?? null,
        status: status ?? "IN_PROGRESS",
        accountEmail,
      },
    });

    // إضافة منشئ المشروع كعضو في ProjectMember
    await prismaAny.projectMember.create({
      data: {
        projectId: project.id,
        userId: currentUserId,
        roleLabel: "منشئ المشروع",
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "رقم المشروع (code) مستخدم مسبقاً" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "خطأ في إنشاء المشروع" },
      { status: 500 }
    );
  }
}
