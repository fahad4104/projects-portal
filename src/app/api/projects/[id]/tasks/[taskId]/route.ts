import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus, Role } from "@prisma/client";

type RoleLabel = "المالك" | "المقاول" | "الاستشاري";

type RouteParams = {
  params: { id: string; taskId: string };
};

type ClientTaskStatus = "pending" | "in_progress" | "done";

type ClientTask = {
  id: string;
  title: string;
  status: ClientTaskStatus;
  owner: RoleLabel;
  target: RoleLabel;
  visibleTo: RoleLabel[];
  createdAt: string;
  completedAt?: string | null;
};

const roleEnumToLabel = (role?: Role | null): RoleLabel => {
  switch (role) {
    case Role.OWNER:
      return "المالك";
    case Role.CONTRACTOR:
      return "المقاول";
    case Role.CONSULTANT:
      return "الاستشاري";
    default:
      return "المقاول";
  }
};

const mapStatusToClient = (status: TaskStatus): ClientTaskStatus => {
  switch (status) {
    case TaskStatus.PENDING:
      return "pending";
    case TaskStatus.IN_PROGRESS:
      return "in_progress";
    case TaskStatus.DONE:
      return "done";
    default:
      return "pending";
  }
};

const mapTaskToClient = (t: any): ClientTask => {
  const visibleTo: RoleLabel[] = [];
  if (t.toOwner) visibleTo.push("المالك");
  if (t.toContractor) visibleTo.push("المقاول");
  if (t.toConsultant) visibleTo.push("الاستشاري");

  const owner = roleEnumToLabel(t.fromRole);
  const target: RoleLabel =
    visibleTo[0] ?? owner ?? ("المقاول" as RoleLabel);

  return {
    id: t.id,
    title: t.title,
    status: mapStatusToClient(t.status),
    owner,
    target,
    visibleTo,
    createdAt: t.createdAt?.toISOString?.() ?? new Date().toISOString(),
    completedAt: null,
  };
};

// PATCH /api/projects/[id]/tasks/[taskId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { taskId } = params;

  try {
    const body = await req.json();
    const newStatus: string = body.status || "pending";

    let prismaStatus: TaskStatus = TaskStatus.PENDING;
    if (newStatus === "done") prismaStatus = TaskStatus.DONE;
    else if (newStatus === "in_progress")
      prismaStatus = TaskStatus.IN_PROGRESS;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: prismaStatus },
    });

    const clientTask = mapTaskToClient(task);

    return NextResponse.json({ task: clientTask });
  } catch (error) {
    console.error(
      "PATCH /api/projects/[id]/tasks/[taskId] error",
      error
    );
    return NextResponse.json(
      { message: "فشل في تحديث المهمة" },
      { status: 500 }
    );
  }
}
