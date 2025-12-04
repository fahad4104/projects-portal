"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/contexts/UserContext";

export default function NewProjectPage() {
  const router = useRouter();
  const { user, logout } = useCurrentUser();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [consultantName, setConsultantName] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user || !user.email || !user.id) {
      setErrorMsg("يجب تسجيل الدخول أولاً.");
      return;
    }

    if (
      !code.trim() ||
      !name.trim() ||
      !ownerName.trim() ||
      !contractorName.trim()
    ) {
      setErrorMsg(
        "رقم المشروع، اسم المشروع، اسم المالك واسم المقاول مطلوبة."
      );
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          ownerName: ownerName.trim(),
          contractorName: contractorName.trim(),
          consultantName: consultantName.trim() || null,
          status: "IN_PROGRESS",
          accountEmail: user.email,
          currentUserId: user.id, // مهم: لربطه بـ ProjectMember
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error || "فشل في إنشاء المشروع.");
        return;
      }

      router.push("/projects");
    } catch (err) {
      console.error("Create project error", err);
      setErrorMsg("حدث خطأ غير متوقع أثناء إنشاء المشروع.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center pt-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 space-y-4">
        {/* هيدر الصفحة */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-bold">إضافة مشروع جديد</h1>
            <p className="text-xs text-gray-500 mt-1">
              المستخدم:{" "}
              <span className="font-semibold">
                {user?.name ?? "مستخدم"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => router.push("/projects")}
              className="text-blue-600 hover:underline"
            >
              ← الرجوع لقائمة المشاريع
            </button>
            <button
              onClick={logout}
              className="text-red-600 hover:underline"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* نموذج إضافة المشروع */}
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">رقم المشروع (code)</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-1.5"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: P-001"
              />
            </div>

            <div>
              <label className="block mb-1">اسم المشروع</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="فيلا عبدالله..."
              />
            </div>

            <div>
              <label className="block mb-1">اسم المالك</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-1.5"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1">اسم المقاول</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-1.5"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1">اسم الاستشاري (اختياري)</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-1.5"
                value={consultantName}
                onChange={(e) => setConsultantName(e.target.value)}
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
          )}

          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ المشروع"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
