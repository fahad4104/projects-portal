import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: { id: string };
};

// إرجاع قائمة أعضاء المشروع
export async function GET(req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const result = members.map((m) => ({
      id: m.id,
      email: m.user?.email ?? "",
      name: m.user?.name ?? null,
      roleLabel: m.roleLabel,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ members: result });
  } catch (error) {
    console.error("GET /api/projects/[id]/members error:", error);
    return NextResponse.json(
      { error: "فشل في تحميل مستخدمي المشروع" },
      { status: 500 }
    );
  }
}

// إضافة مستخدم للمشروع
export async function POST(req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  try {
    const body = await req.json();
    const email: string = body.email;
    const roleLabel: string | null = body.roleLabel ?? null;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    // نبحث عن المستخدم في جدول User عن طريق الإيميل
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "هذا البريد غير مسجّل في النظام. يجب أن يقوم المستخدم بإنشاء حساب أولاً.",
        },
        { status: 404 }
      );
    }

    // ✅ هنا التعديل المهم: بدال projectId_userId استخدمنا findFirst بفلترين
    const existing = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "هذا المستخدم مضاف مسبقًا لهذا المشروع" },
        { status: 400 }
      );
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        roleLabel,
      },
      include: {
        user: true,
      },
    });

    const result = {
      id: member.id,
      email: member.user?.email ?? "",
      name: member.user?.name ?? null,
      roleLabel: member.roleLabel,
      createdAt: member.createdAt.toISOString(),
    };

    return NextResponse.json(
      { message: "تم إضافة المستخدم للمشروع بنجاح", member: result },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects/[id]/members error:", error);
    return NextResponse.json(
      { error: "فشل في إضافة المستخدم للمشروع" },
      { status: 500 }
    );
  }
}
