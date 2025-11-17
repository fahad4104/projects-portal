// @ts-nocheck

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TaskStatusDb = "PENDING" | "IN_PROGRESS" | "DONE";
type TaskStatusClient = "pending" | "in_progress" | "done";

// ========== Helpers ==========
async function getParams(context: any) {
  if ("params" in context) {
    const p = (context as any).params;
    if (p && typeof (p as any).then === "function") {
      return await p;
    }
    return p;
  }
  return {};
}

function labelToRole(label: string): "OWNER" | "CONTRACTOR" | "CONSULTANT" {
  switch (label) {
    case "المالك":
      return "OWNER";
    case "الاستشاري":
      return "CONSULTANT";
    case "المقاول":
    default:
      return "CONTRACTOR";
  }
}

function roleToLabel(role: string): string {
  switch (role) {
    case "OWNER":
      return "المالك";
    case "CONSULTANT":
      return "الاستشاري";
    case "CONTRACTOR":
    default:
      return "المقاول";
  }
}

function visibleLabelsToDb(labels: string[]): string {
  if (!Array.isArray(labels)) return "";
  return labels
    .map((l) => labelToRole(l))
    .join(",");
}

function visibleDbToLabels(value: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map(roleToLabel);
}

function mapStatusToClient(status: TaskStatusDb): TaskStatusClient {
  if (status === "DONE") return "done";
  if (status === "IN_PROGRESS") return "in_progress";
  return "pending";
}

function mapTaskToClient(task: any) {
  return {
    id: task.id,
    title: task.title,
    status: mapStatusToClient(task.status),
    owner: roleToLabel(task.ownerRole),
    target: roleToLabel(task.targetRole),
    visibleTo: visibleDbToLabels(task.visibleToRoles),
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  };
}

// ========== (اختياري) GET: يرجّع مهام المشروع ==========
export async function GET(_req: Request, context: any) {
  try {
    const { id } = await getParams(context);
    const code = id as string;

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

    const tasks = project.tasks.map(mapTaskToClient);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[GET /api/projects/[id]/tasks] error:", error);
    return NextResponse.json(
      { error: "فشل تحميل المهام" },
      { status: 500 }
    );
  }
}

// ========== POST: إضافة مهمة جديدة ==========
export async function POST(req: Request, context: any) {
  try {
    const { id } = await getParams(context);
    const code = id as string;

    const body = await req.json();

    const title = (body.title as string | undefined)?.trim();
    const ownerRoleLabel = body.ownerRoleLabel as string;
    const targetRoleLabel = body.targetRoleLabel as string;
    const visibleToLabels = (body.visibleToLabels as string[]) ?? [];

    if (!title) {
      return NextResponse.json(
        { error: "عنوان المهمة مطلوب" },
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

    const ownerRole = labelToRole(ownerRoleLabel);
    const targetRole = labelToRole(targetRoleLabel);
    const visibleToDb = visibleLabelsToDb(visibleToLabels);

    const created = await prisma.task.create({
      data: {
        projectId: project.id,
        title,
        status: "PENDING",
        ownerRole,
        targetRole,
        visibleToRoles: visibleToDb,
      },
    });

    const taskForClient = mapTaskToClient(created);

    return NextResponse.json({ task: taskForClient });
  } catch (error) {
    console.error("[POST /api/projects/[id]/tasks] error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء المهمة" },
      { status: 500 }
    );
  }
}
