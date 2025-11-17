import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProjectStatus, Role as PrismaRole, TaskStatus as PrismaTaskStatus } from "@prisma/client";

type RoleLabel = "المالك" | "المقاول" | "الاستشاري";
type TaskStatusClient = "pending" | "in_progress" | "done";
type ProjectStatusType = keyof typeof ProjectStatus;

function roleEnumToLabel(role: PrismaRole): RoleLabel {
  switch (role) {
    case "OWNER":
      return "المالك";
    case "CONTRACTOR":
      return "المقاول";
    case "CONSULTANT":
      return "الاستشاري";
    default:
      return "المقاول";
  }
}

function statusEnumToClient(status: PrismaTaskStatus): TaskStatusClient {
  switch (status) {
    case "PENDING":
      return "pending";
    case "IN_PROGRESS":
      return "in_progress";
    case "DONE":
      return "done";
    default:
      return "pending";
  }
}

function visibleStringToLabels(value: string): RoleLabel[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => roleEnumToLabel(s as PrismaRole));
}

export async function GET(
  _req: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    // دعم الحالتين: لو params عادي أو Promise (Next 16)
    const rawParams =
      "then" in (context as any).params
        ? await (context as any).params
        : (context as any).params;

    const code = rawParams.id as string;

    const project = await prisma.project.findUnique({
      where: { code },
      include: { tasks: { orderBy: { createdAt: "desc" } } },
    });

    if (!project) {
      return NextResponse.json(
        { error: "المشروع غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      project: {
        code: project.code,
        name: project.name,
        ownerName: project.ownerName,
        contractorName: project.contractorName,
        consultantName: project.consultantName,
        status: project.status as ProjectStatusType,
      },
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: statusEnumToClient(t.status),
        owner: roleEnumToLabel(t.ownerRole),
        target: roleEnumToLabel(t.targetRole),
        visibleTo: visibleStringToLabels(t.visibleToRoles),
        createdAt: t.createdAt.toISOString(),
        completedAt: t.completedAt
          ? t.completedAt.toISOString()
          : null,
      })),
    });
  } catch (error) {
    console.error(`[GET /api/projects/[id]] error:`, error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحميل تفاصيل المشروع" },
      { status: 500 }
    );
  }
}
