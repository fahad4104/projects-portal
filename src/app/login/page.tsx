"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/contexts/UserContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser } = useCurrentUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // لو هو داخل أصلاً، نودّيه للمشاريع
  useEffect(() => {
    if (user && user.email) {
      router.replace("/projects");
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("البريد الإلكتروني وكلمة المرور مطلوبين");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error || "فشل تسجيل الدخول، تأكد من البيانات");
        return;
      }

      // نجاح تسجيل الدخول
      const loggedInUser = data.user; // { id, name, email }
      setUser(loggedInUser);

      router.push("/projects");
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold text-center">تسجيل الدخول</h1>
        <p className="text-sm text-center text-gray-600">
          أدخل بريدك الإلكتروني وكلمة المرور للدخول إلى بوابة مشاريع باوندري
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring focus:ring-sky-300 text-sm"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              كلمة المرور
            </label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring focus:ring-sky-300 text-sm"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {errorMsg && (
            <div className="text-red-600 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2 font-semibold bg-sky-600 text-white disabled:opacity-60"
          >
            {loading ? "جاري تسجيل الدخول..." : "دخول"}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-2">
          ما عندك حساب؟{" "}
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => router.push("/register")}
          >
            إنشاء حساب جديد
          </button>
        </p>
      </div>
    </div>
  );
}
