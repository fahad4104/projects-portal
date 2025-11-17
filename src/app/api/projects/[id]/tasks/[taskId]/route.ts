// @ts-nocheck

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TaskStatusDb = "PENDING" | "IN_PROGRESS" | "DONE";
type TaskStatusClient = "pending" | "in_progress" | "done";

// ===== Helpers =====

// نفس فكرة getParams اللي استخدمناها في ملفات ثانية
async function getParams(context: any) {
  if ("params" in context) {
    const p = (context as any).params;
    if (p && typeof (p as any).then === "function") {
      // params عبارة عن Promise في Next 16
      return await p;
    }
    return p;
  }
  return {};
}

function mapStatusToPrisma(status: string): TaskStatusDb {
  if (status === "done") return "DONE";
  if (status === "in_progress") return "IN_PROGRESS";
  return "PENDING";
}

function mapStatusToClient(status: TaskStatusDb): TaskStatusClient {
  if (status === "DONE") return "done";
  if (status === "IN_PROGRESS") return "in_progress";
  return "pending";
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

function visibleDbToLabels(value: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map(roleToLabel);
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

// ===== PATCH: تحديث حالة المهمة =====

export async function PATCH(req: Request, context: any) {
  try {
    const { id, taskId } = await getParams(context);
    const code = id as string;
    const taskIdStr = taskId as string;

    if (!taskIdStr) {
      return NextResponse.json(
        { error: "معرّف المهمة غير موجود" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const statusFromClient = (body.status as string) || "pending";
    const prismaStatus = mapStatusToPrisma(statusFromClient);

    // تأكد أن المشروع موجود (اختياري لكن مفيد)
    const project = await prisma.project.findUnique({
      where: { code },
    });

    if (!project) {
      return NextResponse.json(
        { error: "المشروع غير موجود" },
        { status: 404 }
      );
    }

    // نحدّث المهمة
    const updated = await prisma.task.update({
      where: { id: taskIdStr },
      data: {
        status: prismaStatus,
        completedAt: prismaStatus === "DONE" ? new Date() : null,
      },
    });

    const taskForClient = mapTaskToClient(updated);

    return NextResponse.json({ task: taskForClient });
  } catch (error) {
    console.error(
      "[PATCH /api/projects/[id]/tasks/[taskId]] error:",
      error
    );
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المهمة" },
      { status: 500 }
    );
  }
}
