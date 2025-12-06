import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

type RouteParams = {
  params: { id: string };
};

type TaskStatusClient = "pending" | "in_progress" | "done";

type ClientTask = {
  id: string;
  title: string;
  status: TaskStatusClient;
  owner: string;        // نخزن هنا الإيميل أو أي معرف
  assignedTo: string[]; // قائمة الإيميلات الموجهة لهم المهمة
  visibleTo: string[];  // الإيميلات اللي يشوفون المهمة
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

// نحول String JSON إلى مصفوفة سلاسل
function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === "string") as string[];
    }
    return [];
  } catch {
    return [];
  }
}

// نحول سجل DB إلى الشكل اللي تستخدمه الواجهة
function mapTaskToClient(task: any): ClientTask {
  const assigned = parseStringArray(task.assignedToRoles);
  const visible = parseStringArray(task.visibleToRoles);

  return {
    id: task.id,
    title: task.title,
    status: mapStatusToClient(task.status),
    owner: task.ownerRoleLabel ?? "",
    assignedTo: assigned,
    visibleTo: visible,
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  };
}

// ===== GET: جلب المهام =====

export async function GET(_req: NextRequest, { params }: RouteParams) {
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
      ownerRoleLabel?: string;    // هنا نتوقع الإيميل
      assignedToLabels?: string[]; // إيميلات
      visibleToLabels?: string[];  // إيميلات
    } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { message: "عنوان المهمة مطلوب" },
        { status: 400 }
      );
    }

    const owner =
      typeof ownerRoleLabel === "string" && ownerRoleLabel.trim().length > 0
        ? ownerRoleLabel.trim()
        : null;

    const ensureStringArray = (list: any): string[] => {
      if (!Array.isArray(list)) return [];
      return list
        .filter((x) => typeof x === "string")
        .map((x: string) => x.trim())
        .filter((x) => x.length > 0);
    };

    const assigned = ensureStringArray(assignedToLabels);
    const visible = ensureStringArray(visibleToLabels);

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
