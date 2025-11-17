import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProjectStatus } from "@prisma/client";

type ProjectStatusType = keyof typeof ProjectStatus;

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      projects: projects.map((p) => ({
        code: p.code,
        name: p.name,
        ownerName: p.ownerName,
        contractorName: p.contractorName,
        consultantName: p.consultantName,
        status: p.status as ProjectStatusType,
      })),
    });
  } catch (error) {
    console.error("[GET /api/projects] error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحميل المشاريع" },
      { status: 500 }
    );
  }
}
