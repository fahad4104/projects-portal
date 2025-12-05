import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteParams = {
  params: { id: string; drawingId: string };
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId, drawingId } = params;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "لم يتم استلام أي ملف" },
        { status: 400 }
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error("BLOB_READ_WRITE_TOKEN is missing");
      return NextResponse.json(
        { error: "إعداد التخزين غير صحيح (token مفقود)" },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const blobPath = `projects/${projectId}/drawings/${drawingId}-${Date.now()}-${file.name}`;

    const { url } = await put(blobPath, buffer, {
      access: "public",
      token,
      contentType: file.type || "application/octet-stream",
    });

    // نفترض إن عندك موديل اسمه Drawing فيه هذي الحقول:
    // id, projectId, boxName, fileName, filePath, uploadedAt, uploadedBy?
    const drawing = await prisma.drawing.update({
      where: { id: drawingId },
      data: {
        fileName: file.name,
        filePath: url,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json(drawing, { status: 200 });
  } catch (error) {
    console.error("Drawing upload error:", error);
    return NextResponse.json(
      { error: "فشل في حفظ المخطط" },
      { status: 500 }
    );
  }
}
