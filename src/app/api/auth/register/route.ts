import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // نستخدم prisma كـ any لتجاوز مشكلة TypeScript المؤقتة
    const prismaAny = prisma as any;

    // هل الإيميل موجود مسبقاً؟
    const existing = await prismaAny.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "هذا الإيميل مسجّل مسبقاً" },
        { status: 409 }
      );
    }

    // تشفير الباسورد
    const passwordHash = await bcrypt.hash(password, 10);

    // إنشاء المستخدم
    const user = await prismaAny.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    return NextResponse.json(
      {
        message: "تم التسجيل بنجاح",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "خطأ غير متوقع أثناء التسجيل" },
      { status: 500 }
    );
  }
}
