// src/app/api/projects/[id]/drawings/[drawingId]/archive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: {
    id: string;        // project id
    drawingId: string; // drawing id
  };
};

async function archiveDrawing(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { id: projectId, drawingId } = params;

  try {
    const drawing = await prisma.drawing.findFirst({
      where: {
        id: drawingId,
        projectId,
      },
    });

    if (!drawing) {
      return NextResponse.json(
        { message: "لم يتم العثور على المخطط لهذا المشروع" },
        { status: 404 }
      );
    }

    const updated = await prisma.drawing.update({
      where: { id: drawingId },
      data: {
        isArchived: true,
      },
    });

    return NextResponse.json(
      {
        message: "تم نقل المخطط إلى الأرشيف بنجاح",
        drawing: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving drawing:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء نقل المخطط للأرشيف" },
      { status: 500 }
    );
  }
}

// ندعم POST و PATCH عشان أي واحد فيهم تستخدمه الواجهة يشتغل
export async function POST(req: NextRequest, ctx: RouteParams) {
  return archiveDrawing(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: RouteParams) {
  return archiveDrawing(req, ctx);
}
