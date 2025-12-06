import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: {
    id: string;        // projectId
    drawingId: string; // Drawing.id
  };
};

// POST /api/projects/[id]/drawings/[drawingId]/archive
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const { id: projectId, drawingId } = params;

  try {
    const drawing = await prisma.drawing.findFirst({
      where: { id: drawingId, projectId },
    });

    if (!drawing) {
      return NextResponse.json(
        { message: "لم يتم العثور على هذا المخطط" },
        { status: 404 }
      );
    }

    await prisma.drawing.update({
      where: { id: drawingId },
      data: { isArchived: true },
    });

    return NextResponse.json(
      { message: "تم نقل المخطط إلى الأرشيف" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving drawing:", error);
    return NextResponse.json(
      { message: "فشل في نقل المخطط للأرشيف" },
      { status: 500 }
    );
  }
}
