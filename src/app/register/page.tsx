"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/contexts/UserContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, setUser } = useCurrentUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // لو المستخدم مسجل دخول أصلاً، ودّه للمشاريع
  useEffect(() => {
    if (user && user.email) {
      router.replace("/projects");
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("جميع الحقول مطلوبة");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error || "فشل التسجيل، حاول مرة أخرى");
        return;
      }

      // نجح التسجيل
      const newUser = data.user; // { id, name, email }
      setUser(newUser);

      // روح لقائمة المشاريع
      router.push("/projects");
    } catch (error) {
      console.error("Register error:", error);
      setErrorMsg("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold text-center">تسجيل حساب جديد</h1>
        <p className="text-sm text-center text-gray-600">
          أدخل بياناتك للتسجيل في بوابة مشاريع باوندري
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">الاسم</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring focus:ring-sky-300 text-sm"
              placeholder="الاسم الذي سيظهر في المهام والمحادثات"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

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
              autoComplete="new-password"
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
            {loading ? "جاري التسجيل..." : "تسجيل"}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-2">
          لديك حساب بالفعل؟{" "}
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => router.push("/login")}
          >
            تسجيل الدخول
          </button>
        </p>
      </div>
    </div>
  );
}
