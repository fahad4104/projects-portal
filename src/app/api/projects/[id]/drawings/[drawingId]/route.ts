// src/app/api/projects/[id]/drawings/[drawingId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: {
    id: string;        // project id
    drawingId: string; // drawing id
  };
};

// (اختياري) جلب مخطط واحد - لو ما تحتاجه عادي يظل موجود
export async function GET(_req: NextRequest, { params }: RouteParams) {
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
        { message: "لم يتم العثور على المخطط المطلوب" },
        { status: 404 }
      );
    }

    return NextResponse.json(drawing, { status: 200 });
  } catch (error) {
    console.error("Error getting drawing:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب بيانات المخطط" },
      { status: 500 }
    );
  }
}

// حذف مخطط
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id: projectId, drawingId } = params;

  try {
    // نتأكد أول أنه تابع لنفس المشروع
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

    await prisma.drawing.delete({
      where: {
        id: drawingId,
      },
    });

    return NextResponse.json(
      { message: "تم حذف المخطط بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting drawing:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف المخطط" },
      { status: 500 }
    );
  }
}
