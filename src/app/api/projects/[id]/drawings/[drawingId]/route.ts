import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context:
    | { params: { id: string; drawingId: string } }
    | { params: Promise<{ id: string; drawingId: string }> }
) {
  try {
    const rawParams =
      "then" in (context as any).params
        ? await (context as any).params
        : (context as any).params;

    const drawingId = rawParams.drawingId as string;
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
      drawing: {
        id: updated.id,
        boxName: updated.boxName,
        fileName: updated.fileName,
        uploadedBy: updated.uploadedBy,
        uploadedAt: updated.uploadedAt.toISOString(),
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
