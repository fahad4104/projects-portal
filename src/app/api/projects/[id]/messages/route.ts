import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: { id: string };
};

// GET /api/projects/[id]/messages
// مسار شكلي حالياً – يرجّع قائمة رسائل فاضية
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id: projectId } = params;

  // تقدر لاحقاً تربطها بقاعدة البيانات لو سويت موديل للمحادثات
  return NextResponse.json({
    projectId,
    messages: [],
  });
}
