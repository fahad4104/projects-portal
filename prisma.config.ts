import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // مكان ملف الـ schema
  prismaSchemaPath: "prisma/schema.prisma",
  // يقرأ الـ DATABASE_URL من ملف .env
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
