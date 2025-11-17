const { PrismaClient, ProjectStatus, Role, TaskStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // نحذف القديم لو فيه شيء
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  // مشروع فيلا عبدالله
  const abdullah = await prisma.project.create({
    data: {
      code: "P-001",
      name: "فيلا عبدالله",
      ownerName: "عبدالله",
      contractorName: "Boundary للمقاولات",
      consultantName: "مكتب الاستشاري A",
      status: ProjectStatus.IN_PROGRESS,
    },
  });

  // مشروع فيلا سيف
  const saif = await prisma.project.create({
    data: {
      code: "P-002",
      name: "فيلا سيف",
      ownerName: "سيف",
      contractorName: "Boundary للمقاولات",
      consultantName: "مكتب الاستشاري B",
      status: ProjectStatus.PLANNING,
    },
  });

  // مشروع فيلا عيسى
  const essa = await prisma.project.create({
    data: {
      code: "P-003",
      name: "فيلا عيسى (قريباً)",
      ownerName: "عيسى",
      contractorName: "Boundary للمقاولات",
      consultantName: null,
      status: ProjectStatus.RISK,
    },
  });

  // مهام عبدالله
  await prisma.task.createMany({
    data: [
      {
        projectId: abdullah.id,
        title: "اعتماد مخطط السباكة للدور الأرضي",
        status: TaskStatus.PENDING,
        ownerRole: Role.CONSULTANT,
        targetRole: Role.CONTRACTOR,
        visibleToRoles: "OWNER,CONTRACTOR,CONSULTANT",
      },
      {
        projectId: abdullah.id,
        title: "تنفيذ العزل المائي للأساسات",
        status: TaskStatus.IN_PROGRESS,
        ownerRole: Role.CONTRACTOR,
        targetRole: Role.CONTRACTOR,
        visibleToRoles: "CONTRACTOR,CONSULTANT",
      },
    ],
  });

  // مهمة لمشروع سيف
  await prisma.task.create({
    data: {
      projectId: saif.id,
      title: "تأكيد منسوب الشوارع من البلدية",
      status: TaskStatus.PENDING,
      ownerRole: Role.OWNER,
      targetRole: Role.CONSULTANT,
      visibleToRoles: "OWNER,CONSULTANT",
    },
  });

  // مشروع عيسى بدون مهام
}

main()
  .then(async () => {
    console.log("Seed finished ✅");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error ❌", e);
    await prisma.$disconnect();
    process.exit(1);
  });
