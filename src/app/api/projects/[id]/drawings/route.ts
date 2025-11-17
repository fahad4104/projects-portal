import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

type DrawingItem = {
  id: string;
  boxName: string;
  fileName: string | null;
  filePath: string | null;
  uploadedBy: string | null;
  uploadedAt: Date | null;
  isArchived: boolean;
};

// تحويل الشكل من Prisma إلى شكل مناسب للواجهة
function mapDrawing(d: DrawingItem) {
  return {
    id: d.id,
    boxName: d.boxName,
    fileName: d.fileName,
    filePath: d.filePath,
    uploadedBy: d.uploadedBy,
    uploadedAt: d.uploadedAt ? d.uploadedAt.toISOString() : null,
  };
}

// دعم أن params ممكن يكون Promise في Next 16
async function getParams(context: any) {
  if ("params" in context) {
    const p = (context as any).params;
    if (p && typeof (p as any).then === "function") {
      return await p;
    }
    return p;
  }
  return {};
}

// GET: جلب المخططات (الحالية + الأرشيف)
export async function GET(_req: Request, context: any) {
  try {
    const { id } = await getParams(context);
    const code = id as string;

    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        drawings: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "المشروع غير موجود" },
        { status: 404 }
      );
    }

    const active = project.drawings
      .filter((d) => !d.isArchived)
      .map(mapDrawing);
    const archive = project.drawings
      .filter((d) => d.isArchived)
      .map(mapDrawing);

    return NextResponse.json({ active, archive });
  } catch (error) {
    console.error("[GET /api/projects/[id]/drawings] error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحميل المخططات" },
      { status: 500 }
    );
  }
}

// POST: رفع ملف جديد لمربع مخطط (وأرشفة القديم إن وجد)
export async function POST(req: Request, context: any) {
  try {
    const { id } = await getParams(context);
    const code = id as string;

    const project = await prisma.project.findUnique({
      where: { code },
    });

    if (!project) {
      return NextResponse.json(
        { error: "المشروع غير موجود" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const boxName = (formData.get("boxName") as string | null) ?? "مخطط";
    const uploadedBy =
      (formData.get("uploadedBy") as string | null) ?? null;
    const drawingId = formData.get("drawingId") as string | null;
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "لم يتم اختيار ملف" },
        { status: 400 }
      );
    }

    // تجهيز مجلد uploads داخل public
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // حفظ الملف على القرص
    const originalName = file.name;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const uniqueName = `${baseName}-${Date.now()}${ext}`;
    const filePathDisk = path.join(uploadsDir, uniqueName);
    const fileUrl = `/uploads/${uniqueName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(filePathDisk, buffer);

    // لو فيه مخطط سابق لنفس المربع (drawingId) نؤرشفه
    if (drawingId) {
      const existing = await prisma.drawing.findUnique({
        where: { id: drawingId },
      });

      if (existing && !existing.isArchived) {
        await prisma.drawing.update({
          where: { id: drawingId },
          data: { isArchived: true },
        });
      }
    }

    // إنشاء سجل جديد للمخطط الحالي
    await prisma.drawing.create({
      data: {
        projectId: project.id,
        boxName: boxName || "مخطط",
        fileName: originalName,
        filePath: fileUrl,
        uploadedBy,
        uploadedAt: new Date(),
        isArchived: false,
      },
    });

    // إعادة تحميل المخططات بعد التحديث
    const updated = await prisma.project.findUnique({
      where: { code },
      include: {
        drawings: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    const active = updated!.drawings
      .filter((d) => !d.isArchived)
      .map(mapDrawing);
    const archive = updated!.drawings
      .filter((d) => d.isArchived)
      .map(mapDrawing);

    return NextResponse.json({ active, archive });
  } catch (error) {
    console.error("[POST /api/projects/[id]/drawings] error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء رفع المخطط" },
      { status: 500 }
    );
  }
}
