import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    const prismaAny = prisma as any;

    // البحث عن المستخدم
    const user = await prismaAny.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير مسجل" },
        { status: 404 }
      );
    }

    // التحقق من كلمة المرور
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // نجاح تسجيل الدخول
    return NextResponse.json(
      {
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "خطأ غير متوقع أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
