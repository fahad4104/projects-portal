import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Role as PrismaRole,
  TaskStatus as PrismaTaskStatus,
} from "@prisma/client";

type RoleLabel = "المالك" | "المقاول" | "الاستشاري";
type TaskStatusClient = "pending" | "in_progress" | "done";

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

function statusEnumToClient(
  status: PrismaTaskStatus
): TaskStatusClient {
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

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        status: PrismaTaskStatus.DONE,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        status: statusEnumToClient(task.status),
        owner: roleEnumToLabel(task.ownerRole),
        target: roleEnumToLabel(task.targetRole),
        visibleTo: visibleStringToLabels(task.visibleToRoles),
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt
          ? task.completedAt.toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error(
      `[PATCH /api/projects/${params.id}/tasks/${params.taskId}] error:`,
      error
    );
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المهمة" },
      { status: 500 }
    );
  }
}
