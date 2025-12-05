import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// نقرأ الـ secret من الـ env ونفرض أنه string
const rawSecret = process.env.JWT_SECRET;

if (!rawSecret) {
  // حماية وقت التشغيل: إذا نسيت تضبط المتغير يطيح الخط مباشرة
  throw new Error("JWT_SECRET is not set in environment variables");
}

const JWT_SECRET: string = rawSecret;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    // نجيب المستخدم من قاعدة البيانات
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    // تأكيد كلمة المرور
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    // إنشاء التوكن
    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // نرجع الرد ونحط الكوكي
    const res = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 أيام
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "خطأ غير متوقع أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
