import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

type RouteParams = {
  params: { id: string };
};

type PhotoClient = {
  id: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
};

function mapPhoto(p: any): PhotoClient {
  return {
    id: p.id,
    fileName: p.fileName,
    filePath: p.filePath,
    uploadedAt: p.uploadedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

// GET /api/projects/[id]/photos
export async function GET(req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  try {
    const photos = await prisma.projectPhoto.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({
      photos: photos.map(mapPhoto),
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/photos error", error);
    return NextResponse.json(
      { message: "فشل في تحميل صور المشروع" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/photos
export async function POST(req: NextRequest, { params }: RouteParams) {
  const projectId = params.id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "الملف مطلوب" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "project-photos",
      projectId
    );
    await fs.mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filename = `${Date.now()}-${safeOriginalName}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);

    const publicPath = `/project-photos/${projectId}/${filename}`;

    const created = await prisma.projectPhoto.create({
      data: {
        projectId,
        fileName: file.name,
        filePath: publicPath,
      },
    });

    return NextResponse.json(
      { photo: mapPhoto(created) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/projects/[id]/photos error", error);
    return NextResponse.json(
      { message: "فشل في رفع الصورة" },
      { status: 500 }
    );
  }
}
