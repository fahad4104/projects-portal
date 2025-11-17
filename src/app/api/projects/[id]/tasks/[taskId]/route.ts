// @ts-nocheck

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// نحول من قيمة الـ status اللي تجي من الواجهة إلى قيمة Prisma
function mapStatusToPrisma(status: string): "PENDING" | "IN_PROGRESS" | "DONE" {
  if (status === "done") return "DONE";
  if (status === "in_progress") return "IN_PROGRESS";
  return "PENDING";
}

// العكس: من Prisma إلى شكل الواجهة
function mapStatusToClient(
  status: "PENDING" | "IN_PROGRESS" | "DONE"
): "pending" | "in_progress" | "done" {
  if (status === "DONE") return "done";
  if (status === "IN_PROGRESS") return "in_progress";
  return "pending";
}

// نحول role من DB إلى اسم عربي
function roleToLabel(role: string): string {
  switch (role) {
    case "OWNER":
      return "المالك";
    case "CONTRACTOR":
      return "المقاول";
    case "CONSULTANT":
      return "الاستشاري";
    default:
      return role;
  }
}

// نخلي visibleToRoles المخزّنة كنص "OWNER,CONTRACTOR" إلى مصفوفة أسماء عربية
function visibleToToLabels(value: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map(roleToLabel);
}

// PATCH: لتحديث حالة المهمة (وتسجيل تاريخ الاكتمال لو صارت DONE)
export async function PATCH(req: Request, context: any) {
  try {
    const { id, taskId } = context.params; // id هنا كود المشروع، taskId هو رقم المهمة

    const body = await req.json();
    const statusFromClient = (body.status as string) || "pending";

    const prismaStatus = mapStatusToPrisma(statusFromClient);

    // نحدث المهمة نفسها
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: prismaStatus,
        completedAt: prismaStatus === "DONE" ? new Date() : null,
      },
    });

    // نجهز شكل المهمة اللي يرجع للواجهة بنفس الفورمات اللي تستعمله الصفحة
    const taskForClient = {
      id: updated.id,
      title: updated.title,
      status: mapStatusToClient(updated.status),
      owner: roleToLabel(updated.ownerRole),
      target: roleToLabel(updated.targetRole),
      visibleTo: visibleToToLabels(updated.visibleToRoles),
      createdAt: updated.createdAt.toISOString(),
      completedAt: updated.completedAt
        ? updated.completedAt.toISOString()
        : null,
    };

    return NextResponse.json({ task: taskForClient });
  } catch (error) {
    console.error("[PATCH /api/projects/[id]/tasks/[taskId]] error:", error);
    return NextResponse.json(
      { error: "فشل تحديث حالة المهمة" },
      { status: 500 }
    );
  }
}
