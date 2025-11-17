import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/dev/seed
// استعملها مرة واحدة فقط لعمل بيانات تجريبية
export async function GET() {
  try {
    const count = await prisma.project.count();

    if (count > 0) {
      return NextResponse.json({
        ok: true,
        message: "قاعدة البيانات فيها مشاريع بالفعل، لم يتم التكرار.",
        projectsCount: count,
      });
    }

    // ===== إنشاء المشاريع =====
    const p1 = await prisma.project.create({
      data: {
        code: "P-001",
        name: "فيلا عبدالله",
        ownerName: "عبدالله",
        contractorName: "باوندري للمقاولات",
        consultantName: "المكتب الاستشاري",
        status: "IN_PROGRESS" as any, // حسب enum في schema
      },
    });

    const p2 = await prisma.project.create({
      data: {
        code: "P-002",
        name: "فيلا سيف",
        ownerName: "سيف",
        contractorName: "باوندري للمقاولات",
        consultantName: "المكتب الاستشاري",
        status: "PLANNING" as any,
      },
    });

    const p3 = await prisma.project.create({
      data: {
        code: "P-003",
        name: "فيلا عيسى (قريباً)",
        ownerName: "عيسى",
        contractorName: "باوندري للمقاولات",
        consultantName: "المكتب الاستشاري",
        status: "PLANNING" as any,
      },
    });

    // ===== مهام تجريبية لكل مشروع =====
    const makeTasks = async (projectId: string) => {
      await prisma.task.createMany({
        data: [
          {
            projectId,
            title: "تنفيذ القواعد",
            status: "PENDING" as any,
            ownerRole: "CONTRACTOR" as any,
            targetRole: "CONTRACTOR" as any,
            visibleToRoles: "OWNER,CONTRACTOR,CONSULTANT",
          },
          {
            projectId,
            title: "اعتماد المخططات الإنشائية",
            status: "IN_PROGRESS" as any,
            ownerRole: "OWNER" as any,
            targetRole: "CONSULTANT" as any,
            visibleToRoles: "OWNER,CONSULTANT",
          },
          {
            projectId,
            title: "توريد الخرسانة",
            status: "PENDING" as any,
            ownerRole: "CONTRACTOR" as any,
            targetRole: "CONTRACTOR" as any,
            visibleToRoles: "OWNER,CONTRACTOR",
          },
        ],
      });
    };

    await makeTasks(p1.id);
    await makeTasks(p2.id);
    await makeTasks(p3.id);

    // ===== مربعات مخططات (فارغة بدون ملفات) =====
    const makeDrawings = async (projectId: string) => {
      await prisma.drawing.createMany({
        data: [
          {
            projectId,
            boxName: "المخططات المعمارية",
            fileName: "",
            uploadedBy: "",
            uploadedAt: null,
            isArchived: false,
          },
          {
            projectId,
            boxName: "المخططات الإنشائية",
            fileName: "",
            uploadedBy: "",
            uploadedAt: null,
            isArchived: false,
          },
        ],
      });
    };

    await makeDrawings(p1.id);
    await makeDrawings(p2.id);
    await makeDrawings(p3.id);

    return NextResponse.json({
      ok: true,
      message: "تم إنشاء بيانات تجريبية بنجاح.",
      projects: [p1.code, p2.code, p3.code],
    });
  } catch (error) {
    console.error("[DEV SEED ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ أثناء إنشاء البيانات التجريبية." },
      { status: 500 }
    );
  }
}
