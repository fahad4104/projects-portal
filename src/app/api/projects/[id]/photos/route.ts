import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: { id: string };
};

// POST /api/projects/[id]/photos
export async function POST(req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "no-file" },
        { status: 400 }
      );
    }

    // 1) رفع الملف على Vercel Blob
    const { url } = await put(
      `projects/${projectId}/photos/${file.name}`,
      file,
      {
        access: "public",
      }
    );

    // 2) حفظ البيانات في قاعدة البيانات
    const photo = await prisma.projectPhoto.create({
      data: {
        projectId,
        fileName: file.name,
        filePath: url,
        // uploadedBy موجود في الـ schema لكن اختياري (String?)
        // نقدر نتركه فاضي الآن، وبعدين لما نربط المستخدم نحطه هنا
        // uploadedBy: "fahad",  // لو حبيت تجرب
      },
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: "فشل في رفع الصورة" },
      { status: 500 }
    );
  }
}
