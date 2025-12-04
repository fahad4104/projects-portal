import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

type RouteParams = {
  params: { id: string };
};

type RoleLabel = "المالك" | "المقاول" | "الاستشاري";
type TaskStatusClient = "pending" | "in_progress" | "done";

type ClientTask = {
  id: string;
  title: string;
  status: TaskStatusClient;
  owner: RoleLabel;
  assignedTo: RoleLabel[];
  visibleTo: RoleLabel[];
  createdAt: string;
  completedAt?: string | null;
};

// ===== Helpers =====

function mapStatusToClient(status: TaskStatus): TaskStatusClient {
  switch (status) {
    case "IN_PROGRESS":
      return "in_progress";
    case "DONE":
      return "done";
    case "PENDING":
    default:
      return "pending";
  }
}

function mapStatusFromClient(status: TaskStatusClient): TaskStatus {
  switch (status) {
    case "in_progress":
      return TaskStatus.IN_PROGRESS;
    case "done":
      return TaskStatus.DONE;
    case "pending":
    default:
      return TaskStatus.PENDING;
  }
}

function parseRoles(value: string | null): RoleLabel[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (r) => r === "المالك" || r === "المقاول" || r === "الاستشاري"
      ) as RoleLabel[];
    }
    return [];
  } catch {
    return [];
  }
}

function mapTaskToClient(task: any): ClientTask {
  const assigned = parseRoles(task.assignedToRoles);
  const visible = parseRoles(task.visibleToRoles);

  const owner: RoleLabel =
    task.ownerRoleLabel === "المالك" ||
    task.ownerRoleLabel === "المقاول" ||
    task.ownerRoleLabel === "الاستشاري"
      ? task.ownerRoleLabel
      : "المقاول";

  return {
    id: task.id,
    title: task.title,
    status: mapStatusToClient(task.status),
    owner,
    assignedTo: assigned,
    visibleTo: visible,
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  };
}

// ===== GET: جلب المهام =====

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const projectId = params.id;

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    const clientTasks = tasks.map(mapTaskToClient);

    return NextResponse.json({ tasks: clientTasks });
  } catch (error) {
    console.error("GET /api/projects/[id]/tasks error:", error);
    return NextResponse.json(
      { message: "فشل في تحميل المهام" },
      { status: 500 }
    );
  }
}

// ===== POST: إضافة مهمة جديدة =====

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const projectId = params.id;
    const body = await req.json();

    const {
      title,
      ownerRoleLabel,
      assignedToLabels,
      visibleToLabels,
    }: {
      title: string;
      ownerRoleLabel?: RoleLabel;
      assignedToLabels?: RoleLabel[];
      visibleToLabels?: RoleLabel[];
    } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { message: "عنوان المهمة مطلوب" },
        { status: 400 }
      );
    }

    const owner: RoleLabel =
      ownerRoleLabel === "المالك" ||
      ownerRoleLabel === "المقاول" ||
      ownerRoleLabel === "الاستشاري"
        ? ownerRoleLabel
        : "المقاول";

    const validRoles = (list: RoleLabel[] | undefined): RoleLabel[] => {
      if (!Array.isArray(list)) return [];
      return list.filter(
        (r) => r === "المالك" || r === "المقاول" || r === "الاستشاري"
      ) as RoleLabel[];
    };

    const assigned = validRoles(assignedToLabels);
    const visible = validRoles(visibleToLabels);

    const task = await prisma.task.create({
      data: {
        projectId,
        title: title.trim(),
        status: TaskStatus.PENDING,
        ownerRoleLabel: owner,
        assignedToRoles: JSON.stringify(assigned),
        visibleToRoles: JSON.stringify(visible),
      },
    });

    const clientTask = mapTaskToClient(task);

    return NextResponse.json({ task: clientTask });
  } catch (error) {
    console.error("POST /api/projects/[id]/tasks error:", error);
    return NextResponse.json(
      { message: "خطأ في إنشاء المهمة" },
      { status: 500 }
    );
  }
}
