"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "RISK" | "COMPLETED";

type Project = {
  code: string;
  name: string;
  ownerName: string;
  contractorName: string;
  consultantName: string | null;
  status: ProjectStatus;
};

function getStatusLabel(status: ProjectStatus) {
  switch (status) {
    case "PLANNING":
      return "تخطيط";
    case "IN_PROGRESS":
      return "قيد التنفيذ";
    case "RISK":
      return "مخاطر";
    case "COMPLETED":
      return "مكتمل";
    default:
      return "";
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (error) {
        console.error("Error loading projects", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-right">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">مشاريع Boundary</h1>
        <button
          onClick={() => (window.location.href = "/")}
          className="text-sm px-3 py-1 rounded-lg border bg-white hover:bg-gray-50"
        >
          تسجيل خروج
        </button>
      </header>

      {loading ? (
        <p className="text-sm text-gray-500">جاري تحميل المشاريع...</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-gray-500">لا توجد مشاريع حالياً.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.code}
              href={`/projects/${project.code}`}
              className="block bg-white rounded-2xl shadow hover:shadow-md transition-shadow p-4 text-right"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lg">{project.name}</h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    project.status === "IN_PROGRESS"
                      ? "bg-green-100 text-green-700"
                      : project.status === "PLANNING"
                      ? "bg-blue-100 text-blue-700"
                      : project.status === "RISK"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {getStatusLabel(project.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                المالك: {project.ownerName}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                المقاول: {project.contractorName}
              </p>
              <p className="text-sm text-gray-600">
                الاستشاري: {project.consultantName || "-"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
