import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

type RouteParams = {
  params: { id: string };
};

// ✅ Helper لتحويل سجل الـ DB إلى شكل يناسب الواجهة
function mapDrawing(d: any) {
  return {
    id: d.id,
    boxName: d.boxName,
    fileName: d.fileName ?? null,
    filePath: d.filePath ?? null,
    uploadedBy: d.uploadedBy ?? null,
    uploadedAt: d.uploadedAt ? d.uploadedAt.toISOString() : null,
  };
}

// =======================
// GET /api/projects/[id]/drawings
// يرجع:
// { active: [...], archive: [...] }
// =======================
export async function GET(req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  try {
    const drawings = await prisma.drawing.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    });

    const active = drawings
      .filter((d) => !d.isArchived)
      .map((d) => mapDrawing(d));

    const archive = drawings
      .filter((d) => d.isArchived)
      .map((d) => mapDrawing(d));

    return NextResponse.json({ active, archive });
  } catch (error) {
    console.error("GET /api/projects/[id]/drawings error", error);
    return NextResponse.json(
      { message: "فشل في تحميل المخططات" },
      { status: 500 }
    );
  }
}

// =======================
// POST /api/projects/[id]/drawings
//
// يستخدم FormData
// - إنشاء مربع جديد بدون ملف
// - أو رفع ملف (لمربع جديد أو قديم)
// =======================
export async function POST(req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  try {
    const formData = await req.formData();

    const boxNameRaw = formData.get("boxName");
    const uploadedByRaw = formData.get("uploadedBy");
    const drawingIdRaw = formData.get("drawingId");
    const file = formData.get("file") as File | null;

    const boxName =
      typeof boxNameRaw === "string" ? boxNameRaw.trim() : "";
    const uploadedBy =
      typeof uploadedByRaw === "string" ? uploadedByRaw.trim() : null;
    const drawingId =
      typeof drawingIdRaw === "string" && drawingIdRaw.length > 0
        ? drawingIdRaw
        : null;

    if (!boxName) {
      return NextResponse.json(
        { message: "اسم المربع (المخطط) مطلوب" },
        { status: 400 }
      );
    }

    // مسار تخزين الملفات في /public/uploads
    let storedFileName: string | null = null;
    let storedFilePath: string | null = null;

    if (file) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const filename = `${Date.now()}-${safeOriginalName}`;
      const filepath = path.join(uploadDir, filename);

      await fs.writeFile(filepath, buffer);

      storedFileName = file.name;
      storedFilePath = `/uploads/${filename}`;
    }

    // لو فيه drawingId ومعاه ملف → نأرشف القديم وننشئ سجل جديد
    if (drawingId && file) {
      const existing = await prisma.drawing.findUnique({
        where: { id: drawingId },
      });

      if (existing) {
        // نأرشف القديم
        await prisma.drawing.update({
          where: { id: drawingId },
          data: { isArchived: true },
        });
      }

      const created = await prisma.drawing.create({
        data: {
          projectId,
          boxName,
          fileName: storedFileName,
          filePath: storedFilePath,
          uploadedBy,
          isArchived: false,
        },
      });

      return NextResponse.json(
        { drawing: mapDrawing(created) },
        { status: 201 }
      );
    }

    // لو ما فيه ملف → فقط إنشاء مربع بدون ملف
    if (!file && !drawingId) {
      const created = await prisma.drawing.create({
        data: {
          projectId,
          boxName,
          fileName: null,
          filePath: null,
          uploadedBy,
          isArchived: false,
        },
      });

      return NextResponse.json(
        { drawing: mapDrawing(created) },
        { status: 201 }
      );
    }

    // لو فيه ملف بدون drawingId → إنشاء مخطط جديد مع ملف
    if (file && !drawingId) {
      const created = await prisma.drawing.create({
        data: {
          projectId,
          boxName,
          fileName: storedFileName,
          filePath: storedFilePath,
          uploadedBy,
          isArchived: false,
        },
      });

      return NextResponse.json(
        { drawing: mapDrawing(created) },
        { status: 201 }
      );
    }

    // حالة غريبة (drawingId بدون ملف)
    return NextResponse.json(
      { message: "لا يوجد ملف مرفوع، استخدم PATCH لتعديل الاسم فقط" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/projects/[id]/drawings error", error);
    return NextResponse.json(
      { message: "فشل في حفظ المخطط" },
      { status: 500 }
    );
  }
}
