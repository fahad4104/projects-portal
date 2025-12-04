import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/dev/seed
export async function GET() {
  try {
    // 🧹 تصفير البيانات (لبيئة التطوير فقط)
    await prisma.task.deleteMany();
    await prisma.drawing.deleteMany();
    await prisma.project.deleteMany();

    // 🏗 إنشاء مشروع تجريبي واحد
    const project = await prisma.project.create({
      data: {
        id: "P-001",
        code: "P-001",                 // كود المشروع
        name: "مشروع تجريبي 1",       // اسم المشروع
        ownerName: "Owner",
        contractorName: "Contractor",
        consultantName: "Consultant",
        // status يجي من الـ default في الـ schema (PLANNING مثلاً)
      },
    });

    // ✅ إضافة مهام تجريبية للمشروع
    await prisma.task.createMany({
      data: [
        {
          id: "T-001",
          title: "مهمة إعداد الموقع",
          projectId: project.id,
          ownerRole: "OWNER",          // Enum Role
          targetRole: "CONTRACTOR",    // Enum Role
          status: "PENDING",           // Enum TaskStatus
          // visibleToRoles مخزّن كـ JSON string في الـ DB
          visibleToRoles: JSON.stringify([
            "OWNER",
            "CONTRACTOR",
            "CONSULTANT",
          ]),
        },
        {
          id: "T-002",
          title: "مهمة تجهيز المخططات",
          projectId: project.id,
          ownerRole: "OWNER",
          targetRole: "CONSULTANT",
          status: "PENDING",
          visibleToRoles: JSON.stringify([
            "OWNER",
            "CONTRACTOR",
            "CONSULTANT",
          ]),
        },
      ],
    });

    return NextResponse.json({ ok: true, project });
  } catch (error) {
    console.error("[DEV SEED] error:", error);
    return NextResponse.json(
      { error: "seed failed" },
      { status: 500 }
    );
  }
}
