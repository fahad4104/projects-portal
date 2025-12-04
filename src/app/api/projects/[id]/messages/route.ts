import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: { id: string };
};

// GET /api/projects/[id]/messages
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: projectId } = params;

  try {
    const messages = await prisma.projectMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /messages error", error);
    return NextResponse.json(
      { message: "فشل في تحميل المحادثة" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/messages
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: projectId } = params;

  try {
    const body = await req.json();
    const { authorRole, content } = body as {
      authorRole?: string;
      content?: string;
    };

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { message: "نص الرسالة مطلوب" },
        { status: 400 }
      );
    }

    const message = await prisma.projectMessage.create({
      data: {
        projectId,
        authorRole: authorRole ?? "المقاول",
        content: content.trim(),
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("POST /messages error", error);
    return NextResponse.json(
      { message: "فشل في إرسال الرسالة" },
      { status: 500 }
    );
  }
}
