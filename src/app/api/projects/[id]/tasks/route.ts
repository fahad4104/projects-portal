import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Role as PrismaRole,
  TaskStatus as PrismaTaskStatus,
} from "@prisma/client";

type RoleLabel = "المالك" | "المقاول" | "الاستشاري";
type TaskStatusClient = "pending" | "in_progress" | "done";

function roleLabelToEnum(label: RoleLabel): PrismaRole {
  switch (label) {
    case "المالك":
      return "OWNER";
    case "المقاول":
      return "CONTRACTOR";
    case "الاستشاري":
      return "CONSULTANT";
    default:
      return "CONTRACTOR";
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

function visibleLabelsToString(labels: RoleLabel[]): string {
  const enums = labels.map(roleLabelToEnum);
  return enums.join(",");
}

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

function visibleStringToLabels(value: string): RoleLabel[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => roleEnumToLabel(s as PrismaRole));
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const code = params.id;
    const body = await req.json();

    const title: string = body.title;
    const ownerRoleLabel: RoleLabel = body.ownerRoleLabel;
    const targetRoleLabel: RoleLabel = body.targetRoleLabel;
    let visibleToLabels: RoleLabel[] = body.visibleToLabels || [];

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "العنوان مطلوب" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { code },
    });

    if (!project) {
      return NextResponse.json(
        { error: "المشروع غير موجود" },
        { status: 404 }
      );
    }

    // تأكد أن صاحب المهمة موجود ضمن من يشاهد
    if (!visibleToLabels.includes(ownerRoleLabel)) {
      visibleToLabels = [...visibleToLabels, ownerRoleLabel];
    }

    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: title.trim(),
        status: PrismaTaskStatus.PENDING,
        ownerRole: roleLabelToEnum(ownerRoleLabel),
        targetRole: roleLabelToEnum(targetRoleLabel),
        visibleToRoles: visibleLabelsToString(visibleToLabels),
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
      `[POST /api/projects/${params.id}/tasks] error:`,
      error
    );
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة المهمة" },
      { status: 500 }
    );
  }
}
