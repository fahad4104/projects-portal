import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: { id: string };
};

// GET /api/projects/[id]
export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { message: "المشروع غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("GET /api/projects/[id] error", error);
    return NextResponse.json(
      { message: "فشل في تحميل بيانات المشروع" },
      { status: 500 }
    );
  }
}
