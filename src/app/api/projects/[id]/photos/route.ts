import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

type RouteParams = {
  params: { id: string };
};

// ✅ جلب صور المشروع
export async function GET(req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  try {
    const photos = await prisma.projectPhoto.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("GET /photos error:", error);
    return NextResponse.json(
      { error: "فشل في تحميل صور المشروع" },
      { status: 500 }
    );
  }
}

// ✅ رفع صورة جديدة
export async function POST(req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("BLOB_READ_WRITE_TOKEN is missing");
    return NextResponse.json(
      { error: "إعداد التخزين غير مكتمل (BLOB_READ_WRITE_TOKEN مفقود)" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "لم يتم إرسال ملف صالح" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // نستخدم الاسم والامتداد من الملف نفسه
    const originalName = (file as any).name || "photo";
    const safeName = originalName.replace(/\s+/g, "_");
    const path = `projects/${projectId}/photos/${Date.now()}_${safeName}`;

    // رفع الملف إلى Vercel Blob
    const { url } = await put(path, buffer, {
      access: "public",
      token,
      contentType: file.type || undefined,
    });

    // تخزين بيانات الصورة في قاعدة البيانات
    const photo = await prisma.projectPhoto.create({
      data: {
        projectId,
        fileName: originalName,
        filePath: url, // هذا الرابط اللي بنستخدمه في الواجهة
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "فشل في رفع الصورة" },
      { status: 500 }
    );
  }
}
