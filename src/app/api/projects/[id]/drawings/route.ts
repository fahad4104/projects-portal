import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

type RouteParams = {
  params: { id: string };
};

// GET /api/projects/[id]/drawings
// يرجّع المخططات النشطة + المؤرشفة
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  try {
    const drawings = await prisma.drawing.findMany({
      where: { projectId },
      orderBy: { boxName: "asc" },
    });

    const active = drawings.filter((d) => !d.isArchived);
    const archive = drawings.filter((d) => d.isArchived);

    return NextResponse.json({ active, archive }, { status: 200 });
  } catch (error) {
    console.error("Error fetching drawings:", error);
    return NextResponse.json(
      { message: "خطأ في تحميل المخططات" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/drawings
// يستخدم في:
// 1) إنشاء مربع جديد بدون ملف (boxName + uploadedBy فقط)
// 2) رفع ملف جديد (مع drawingId اختياريًا لاستبدال ملف سابق)
export async function POST(req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  try {
    const formData = await req.formData();

    const boxName = (formData.get("boxName") as string | null)?.trim();
    const uploadedBy = (formData.get("uploadedBy") as string | null)?.trim();
    const drawingId = formData.get("drawingId") as string | null; // اختياري
    const file = formData.get("file") as File | null; // اختياري

    if (!boxName) {
      return NextResponse.json(
        { message: "اسم المربع (boxName) مطلوب" },
        { status: 400 }
      );
    }

    // لو ما في ملف ولا drawingId -> مجرد إنشاء مربع جديد بدون ملف
    if (!file && !drawingId) {
      const created = await prisma.drawing.create({
        data: {
          projectId,
          boxName,
          uploadedBy: uploadedBy || null,
          uploadedAt: null,
          isArchived: false,
        },
      });

      return NextResponse.json({ drawing: created }, { status: 201 });
    }

    // لو في ملف، نرفعه باستخدام Vercel Blob
    if (!file) {
      return NextResponse.json(
        { message: "لم يتم استلام أي ملف" },
        { status: 400 }
      );
    }

    // رفع الملف إلى Vercel Blob
    const blob = await put(
      `projects/${projectId}/drawings/${Date.now()}-${file.name}`,
      file,
      { access: "public" }
    );

    const fileName = file.name;
    const filePath = blob.url;

    // لو تم إرسال drawingId -> نؤرشف القديم (إن وجد) ثم ننشئ سجل جديد بنفس اسم المربع
    if (drawingId) {
      const existing = await prisma.drawing.findFirst({
        where: { id: drawingId, projectId },
      });

      if (existing) {
        // نجعل القديم مؤرشف
        await prisma.drawing.update({
          where: { id: existing.id },
          data: { isArchived: true },
        });
      }

      const created = await prisma.drawing.create({
        data: {
          projectId,
          boxName,
          fileName,
          filePath,
          uploadedBy: uploadedBy || null,
          uploadedAt: new Date(),
          isArchived: false,
        },
      });

      return NextResponse.json({ drawing: created }, { status: 201 });
    }

    // لا يوجد drawingId لكن يوجد ملف -> إنشاء مخطط جديد بملف جديد
    const created = await prisma.drawing.create({
      data: {
        projectId,
        boxName,
        fileName,
        filePath,
        uploadedBy: uploadedBy || null,
        uploadedAt: new Date(),
        isArchived: false,
      },
    });

    return NextResponse.json({ drawing: created }, { status: 201 });
  } catch (error) {
    console.error("Error saving drawing:", error);
    return NextResponse.json(
      { message: "فشل في حفظ المخطط" },
      { status: 500 }
    );
  }
}
