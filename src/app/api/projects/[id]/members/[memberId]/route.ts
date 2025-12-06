import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: {
    id: string;       // projectId
    memberId: string; // ProjectMember.id
  };
};

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id: projectId, memberId } = params;

  try {
    // نتأكد أن العضو تابع لهذا المشروع
    const member = await prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "لم يتم العثور على هذا المستخدم في المشروع" },
        { status: 404 }
      );
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json(
      { message: "تم إزالة المستخدم من المشروع بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إزالة المستخدم من المشروع" },
      { status: 500 }
    );
  }
}
