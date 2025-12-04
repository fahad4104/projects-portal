"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/contexts/UserContext";

type Project = {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  contractorName: string;
  consultantName?: string | null;
  status: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const { user, logout } = useCurrentUser();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.email || !user.id) {
      router.replace("/login");
      return;
    }

    async function loadProjects() {
      try {
        if (!user || !user.email || !user.id) return;

        const res = await fetch(
          `/api/projects?email=${encodeURIComponent(
            user.email
          )}&userId=${encodeURIComponent(user.id)}`
        );
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error("Failed to load projects", err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [user, router]);

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      {/* الهيدر */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">مشاريعك</h1>
          <p className="text-xs text-gray-500 mt-1">
            مرحباً،{" "}
            <span className="font-semibold">
              {user?.name ?? "مستخدم"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => router.push("/projects/new")}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            + إضافة مشروع جديد
          </button>
          <button
            onClick={logout}
            className="text-red-600 hover:underline"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* قائمة المشاريع */}
      {projects.length === 0 ? (
        <p className="text-gray-500 text-sm">
          لا توجد مشاريع مرتبطة بحسابك حتى الآن.
        </p>
      ) : (
        <div className="grid gap-3">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer text-sm"
              onClick={() => router.push(`/projects/${proj.id}`)}
            >
              <div className="font-bold mb-1">
                {proj.code} – {proj.name}
              </div>
              <div className="text-xs text-gray-600">
                المالك: {proj.ownerName} • المقاول: {proj.contractorName}
              </div>
              {proj.consultantName && (
                <div className="text-xs text-gray-500 mt-1">
                  الاستشاري: {proj.consultantName}
                </div>
              )}
              <div className="text-[11px] text-gray-400 mt-1">
                الحالة: {proj.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
