import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ContextType =
  | { params: { id: string; drawingId: string } }
  | { params: Promise<{ id: string; drawingId: string }> };

async function getParams(context: ContextType) {
  const rawParams =
    "then" in (context as any).params
      ? await (context as any).params
      : (context as any).params;

  return rawParams as { id: string; drawingId: string };
}

// =======================
// PATCH → تعديل اسم المربع
// =======================
export async function PATCH(req: Request, context: ContextType) {
  try {
    const { drawingId } = await getParams(context);
    const body = await req.json();
    const boxName: string = body.boxName;

    if (!boxName?.trim()) {
      return NextResponse.json(
        { error: "اسم المربع مطلوب" },
        { status: 400 }
      );
    }

    const updated = await prisma.drawing.update({
      where: { id: drawingId },
      data: { boxName: boxName.trim() },
    });

    return NextResponse.json({
      updated: {
        id: updated.id,
        boxName: updated.boxName,
        fileName: updated.fileName,
        filePath: updated.filePath,
        uploadedBy: updated.uploadedBy,
        uploadedAt: updated.uploadedAt
          ? updated.uploadedAt.toISOString()
          : null,
        isArchived: updated.isArchived,
      },
    });
  } catch (error) {
    console.error(
      "[PATCH /api/projects/[id]/drawings/[drawingId]] error:",
      error
    );
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعديل اسم المربع" },
      { status: 500 }
    );
  }
}

// =======================
// DELETE → نقل المخطط للأرشيف
// =======================
export async function DELETE(req: NextRequest, context: ContextType) {
  try {
    const { drawingId } = await getParams(context);

    const updated = await prisma.drawing.update({
      where: { id: drawingId },
      data: { isArchived: true },
    });

    return NextResponse.json({
      archived: {
        id: updated.id,
        boxName: updated.boxName,
        fileName: updated.fileName,
        filePath: updated.filePath,
        uploadedBy: updated.uploadedBy,
        uploadedAt: updated.uploadedAt
          ? updated.uploadedAt.toISOString()
          : null,
        isArchived: updated.isArchived,
      },
    });
  } catch (error) {
    console.error(
      "[DELETE /api/projects/[id]/drawings/[drawingId]] error:",
      error
    );
    return NextResponse.json(
      { error: "حدث خطأ أثناء نقل المخطط للأرشيف" },
      { status: 500 }
    );
  }
}
