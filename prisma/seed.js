// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // نشتغل بمبدأ upsert عشان لو انزرع قبل ما يعطي خطأ
  const projectsData = [
    {
      code: "P-001",
      name: "فيلا عبدالله",
      ownerName: "عبدالله",
      contractorName: "باوندري للمقاولات",
      consultantName: "المكتب الاستشاري",
      status: "IN_PROGRESS", // حسب enum ProjectStatus في schema.prisma
    },
    {
      code: "P-002",
      name: "فيلا سيف",
      ownerName: "سيف",
      contractorName: "باوندري للمقاولات",
      consultantName: "المكتب الاستشاري",
      status: "PLANNING",
    },
    {
      code: "P-003",
      name: "فيلا عيسى (قريباً)",
      ownerName: "عيسى",
      contractorName: "باوندري للمقاولات",
      consultantName: "المكتب الاستشاري",
      status: "PLANNING",
    },
  ];

  for (const p of projectsData) {
    const project = await prisma.project.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        name: p.name,
        ownerName: p.ownerName,
        contractorName: p.contractorName,
        consultantName: p.consultantName,
        status: p.status,
      },
    });

    // مهام تجريبية لكل مشروع
    await prisma.task.createMany({
      data: [
        {
          projectId: project.id,
          title: "تنفيذ القواعد",
          status: "PENDING", // enum TaskStatus: PENDING | IN_PROGRESS | DONE
          ownerRole: "CONTRACTOR", // OWNER | CONTRACTOR | CONSULTANT
          targetRole: "CONTRACTOR",
          visibleToRoles: "OWNER,CONTRACTOR,CONSULTANT",
        },
        {
          projectId: project.id,
          title: "اعتماد المخططات الإنشائية",
          status: "IN_PROGRESS",
          ownerRole: "OWNER",
          targetRole: "CONSULTANT",
          visibleToRoles: "OWNER,CONSULTANT",
        },
        {
          projectId: project.id,
          title: "توريد الخرسانة",
          status: "PENDING",
          ownerRole: "CONTRACTOR",
          targetRole: "CONTRACTOR",
          visibleToRoles: "OWNER,CONTRACTOR",
        },
      ],
    });

    // مربعات مخططات تجريبية (فارغة بدون ملفات فعلياً)
    await prisma.drawing.createMany({
      data: [
        {
          projectId: project.id,
          boxName: "المخططات المعمارية",
          fileName: "",
          uploadedBy: "",
          uploadedAt: null,
          isArchived: false,
        },
        {
          projectId: project.id,
          boxName: "المخططات الإنشائية",
          fileName: "",
          uploadedBy: "",
          uploadedAt: null,
          isArchived: false,
        },
      ],
    });
  }

  console.log("✅ Seeding finished");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
