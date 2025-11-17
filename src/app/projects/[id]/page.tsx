"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type RoleLabel = "المالك" | "المقاول" | "الاستشاري";
type TaskStatusClient = "pending" | "in_progress" | "done";

type Task = {
  id: string;
  title: string;
  status: TaskStatusClient;
  owner: RoleLabel;
  target: RoleLabel;
  visibleTo: RoleLabel[];
  createdAt: string;
  completedAt?: string | null;
};

type Tab = "chat" | "drawings" | "photos" | "tasks" | "drawingsArchive";

type ProjectInfo = {
  code: string;
  name: string;
  ownerName: string;
  contractorName: string;
  consultantName: string | null;
};

type DrawingItem = {
  id: string;
  boxName: string;
  fileName: string | null;
  filePath: string | null;
  uploadedBy: string | null;
  uploadedAt: string | null;
};

const mockMessages = [
  {
    id: "M-001",
    author: "المقاول" as RoleLabel,
    text: "تم الانتهاء من صب القواعد وجاهزين للمعاينة.",
    time: "10:15 AM",
  },
  {
    id: "M-002",
    author: "الاستشاري" as RoleLabel,
    text: "يرجى إرسال صور للتسليح قبل الصب القادم.",
    time: "11:02 AM",
  },
];

const mockPhotos = [
  {
    id: "P-001",
    title: "تسليح القواعد قبل الصب",
    note: "بانتظار اعتماد الاستشاري",
    date: "2025-11-15",
  },
  {
    id: "P-002",
    title: "صور الواجهة الأمامية",
    note: "قبل تركيب الحجر",
    date: "2025-11-16",
  },
];

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const projectCode = params.id;

  const [currentUserRole, setCurrentUserRole] =
    useState<RoleLabel>("المقاول");
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTarget, setNewTaskTarget] =
    useState<RoleLabel>("المقاول");
  const [newTaskVisibleTo, setNewTaskVisibleTo] = useState<RoleLabel[]>(
    []
  );

  // المخططات
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [archiveDrawings, setArchiveDrawings] = useState<DrawingItem[]>(
    []
  );
  const [loadingDrawings, setLoadingDrawings] = useState(true);
  const [drawingTitles, setDrawingTitles] = useState<
    Record<string, string>
  >({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingTasks(true);
        setLoadingDrawings(true);

        const [projRes, drawingsRes] = await Promise.all([
          fetch(`/api/projects/${projectCode}`),
          fetch(`/api/projects/${projectCode}/drawings`),
        ]);

        const projData = await projRes.json();
        const drawingsData = await drawingsRes.json();

        if (projRes.ok) {
          setProject(projData.project);
          setTasks(projData.tasks || []);
        } else {
          console.error("Error loading project", projData.error);
        }

        if (drawingsRes.ok) {
          const active: DrawingItem[] = drawingsData.active || [];
          const archive: DrawingItem[] = drawingsData.archive || [];
          setDrawings(active);
          setArchiveDrawings(archive);

          const titles: Record<string, string> = {};
          active.forEach((d) => {
            titles[d.id] = d.boxName;
          });
          setDrawingTitles(titles);
        } else {
          console.error("Error loading drawings", drawingsData.error);
        }
      } catch (error) {
        console.error("Error loading data", error);
      } finally {
        setLoadingTasks(false);
        setLoadingDrawings(false);
      }
    };

    if (projectCode) {
      loadData();
    }
  }, [projectCode]);

  // ===== المهام =====

  const visibleTasks = tasks.filter((t) =>
    t.visibleTo.includes(currentUserRole)
  );
  const activeTasks = visibleTasks.filter(
    (t) => t.status !== "done"
  );
  const completedTasks = visibleTasks.filter(
    (t) => t.status === "done"
  );

  const handleVisibleToChange = (role: RoleLabel) => {
    setNewTaskVisibleTo((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectCode}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          ownerRoleLabel: currentUserRole,
          targetRoleLabel: newTaskTarget,
          visibleToLabels: newTaskVisibleTo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Error adding task", data.error);
        return;
      }

      setTasks((prev) => [data.task, ...prev]);
      setNewTaskTitle("");
      setNewTaskTarget("المقاول");
      setNewTaskVisibleTo([]);
    } catch (error) {
      console.error("Error adding task", error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectCode}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "done" }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("Error completing task", data.error);
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? data.task : t))
      );
    } catch (error) {
      console.error("Error completing task", error);
    }
  };

  // ===== المخططات =====

  const handleDrawingTitleChange = (id: string, value: string) => {
    setDrawingTitles((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddDrawingBox = () => {
    const tempId = `temp-${Date.now()}`;
    const newBox: DrawingItem = {
      id: tempId,
      boxName: "مخطط جديد",
      fileName: null,
      filePath: null,
      uploadedBy: null,
      uploadedAt: null,
    };

    setDrawings((prev) => [newBox, ...prev]);
    setDrawingTitles((prev) => ({ ...prev, [tempId]: newBox.boxName }));
  };

  const formatArabicDateTime = (value: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    return d.toLocaleString("ar-EG", {
      hour12: true,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUploadDrawingFile = async (
    drawing: DrawingItem,
    file: File | null
  ) => {
    if (!file) return;

    const hasExistingFile = !!drawing.fileName;
    const boxTitle =
      drawingTitles[drawing.id] ?? drawing.boxName ?? "مخطط";

    if (hasExistingFile) {
      const ok = window.confirm(
        "سيتم نقل الملف القديم إلى الأرشيف واستبداله بالملف الجديد، هل أنت متأكد؟"
      );
      if (!ok) return;
    }

    try {
      setUploadingId(drawing.id);

      const formData = new FormData();
      formData.append("boxName", boxTitle);
      formData.append("uploadedBy", currentUserRole);

      if (!drawing.id.startsWith("temp-")) {
        formData.append("drawingId", drawing.id);
      }

      formData.append("file", file);

      const res = await fetch(
        `/api/projects/${projectCode}/drawings`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error uploading drawing", data.error);
        alert(data.error || "تعذر رفع الملف");
        return;
      }

      const active: DrawingItem[] = data.active || [];
      const archive: DrawingItem[] = data.archive || [];

      setDrawings(active);
      setArchiveDrawings(archive);

      const titles: Record<string, string> = {};
      active.forEach((d) => {
        titles[d.id] = d.boxName;
      });
      setDrawingTitles(titles);
    } catch (error) {
      console.error("Error uploading drawing", error);
      alert("تعذر رفع الملف");
    } finally {
      setUploadingId(null);
    }
  };

  // ===== واجهة الصفحة =====

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-right">
      {/* شريط علوي */}
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">
            رقم المشروع: {projectCode}
          </p>
          <h1 className="text-2xl font-bold">
            {project ? project.name : "تفاصيل المشروع"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs">
            <label className="ml-1">الدخول كـ:</label>
            <select
              className="border rounded-lg px-2 py-1 text-xs bg-white"
              value={currentUserRole}
              onChange={(e) =>
                setCurrentUserRole(e.target.value as RoleLabel)
              }
            >
              <option value="المالك">المالك</option>
              <option value="المقاول">المقاول</option>
              <option value="الاستشاري">الاستشاري</option>
            </select>
          </div>

          <Link
            href="/projects"
            className="text-sm px-3 py-1 rounded-lg border bg-white hover:bg-gray-50"
          >
            رجوع لقائمة المشاريع →
          </Link>
        </div>
      </header>

      {/* التبويبات */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["chat", "drawings", "photos", "tasks", "drawingsArchive"] as Tab[]).map(
          (tab) => (
            <TabButton
              key={tab}
              label={
                {
                  chat: "محادثة",
                  drawings: "مخططات",
                  photos: "صور",
                  tasks: "مهام",
                  drawingsArchive: "ارشيف مخططات",
                }[tab]
              }
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          )
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        {/* تبويب المهام */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            {/* إضافة مهمة */}
            <div className="border rounded-2xl p-3 bg-gray-50 space-y-2 text-sm">
              <input
                type="text"
                className="w-full border rounded-lg p-2 text-sm mb-2"
                placeholder="عنوان المهمة..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="text-xs">
                  <label className="block mb-1">موجهة لـ:</label>
                  <select
                    className="w-full border rounded-lg px-2 py-1 bg-white"
                    value={newTaskTarget}
                    onChange={(e) =>
                      setNewTaskTarget(e.target.value as RoleLabel)
                    }
                  >
                    <option value="المالك">المالك</option>
                    <option value="المقاول">المقاول</option>
                    <option value="الاستشاري">الاستشاري</option>
                  </select>
                </div>

                <div className="text-xs">
                  <label className="block mb-1">
                    مين يشوف المهمة؟ (ممكن أكثر من واحد)
                  </label>
                  <div className="flex flex-col gap-1 bg-white p-2 border rounded-lg">
                    {(["المالك", "المقاول", "الاستشاري"] as RoleLabel[]).map(
                      (role) => (
                        <label
                          key={role}
                          className="flex items-center gap-2 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={newTaskVisibleTo.includes(role)}
                            onChange={() => handleVisibleToChange(role)}
                          />
                          {role}
                        </label>
                      )
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddTask}
                className="mt-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs"
              >
                إضافة المهمة
              </button>
            </div>

            {loadingTasks ? (
              <p className="text-xs text-gray-500">
                جاري تحميل المهام...
              </p>
            ) : (
              <>
                {/* الحالية */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">
                    المهام الحالية
                  </h3>

                  {activeTasks.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      لا توجد مهام حالية متاحة لك.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeTasks.map((t) => {
                        const canComplete =
                          t.target === currentUserRole;
                        return (
                          <div
                            key={t.id}
                            className="border rounded-xl p-3 flex items-center justify-between text-sm"
                          >
                            <div>
                              <p className="font-semibold">{t.title}</p>
                              <p className="text-xs text-gray-500">
                                موجهة إلى: {t.target} • صاحب
                                المهمة: {t.owner}
                              </p>
                              <p className="text-xs text-gray-500">
                                تاريخ الإضافة:{" "}
                                {formatArabicDateTime(t.createdAt)}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <button
                                onClick={() =>
                                  canComplete &&
                                  handleCompleteTask(t.id)
                                }
                                disabled={!canComplete}
                                className={`text-xs px-3 py-1 rounded-lg border ${
                                  canComplete
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                وضع ✓ كمكتملة
                              </button>

                              {!canComplete && (
                                <p className="text-[10px] text-gray-400">
                                  فقط الشخص الموجهة له المهمة (
                                  {t.target}) يقدر يكملها
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* المكتملة */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">
                    المهام المكتملة
                  </h3>

                  {completedTasks.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      لا توجد مهام مكتملة متاحة لك.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {completedTasks.map((t) => (
                        <div
                          key={t.id}
                          className="border rounded-xl p-3 flex items-center justify-between text-sm bg-green-50"
                        >
                          <div>
                            <p className="font-semibold line-through">
                              {t.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              موجهة إلى: {t.target} • صاحب المهمة:{" "}
                              {t.owner}
                            </p>
                            <p className="text-xs text-gray-500">
                              تاريخ الإضافة:{" "}
                              {formatArabicDateTime(t.createdAt)}
                            </p>
                            <p className="text-xs text-gray-500">
                              تاريخ الاكتمال:{" "}
                              {t.completedAt
                                ? formatArabicDateTime(
                                    t.completedAt
                                  )
                                : "—"}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                            مكتملة
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* تبويب المخططات */}
        {activeTab === "drawings" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">مخططات المشروع</h3>
              <button
                onClick={handleAddDrawingBox}
                className="text-xs px-3 py-1 rounded-lg border bg-gray-50 hover:bg-gray-100"
              >
                إضافة مربع مخطط
              </button>
            </div>

            {loadingDrawings ? (
              <p className="text-xs text-gray-500">
                جاري تحميل المخططات...
              </p>
            ) : drawings.length === 0 ? (
              <p className="text-xs text-gray-500">
                لا توجد مخططات بعد، اضغط على &quot;إضافة مربع
                مخطط&quot; لإنشاء أول مربع.
              </p>
            ) : (
              <div className="space-y-3">
                {drawings.map((d) => {
                  const hasFile = !!d.fileName;
                  const title = drawingTitles[d.id] ?? d.boxName;

                  return (
                    <div
                      key={d.id}
                      className="border rounded-xl p-3 text-sm bg-gray-50"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1">
                          <label className="text-xs block mb-1">
                            اسم المربع (قابل للتعديل):
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2 text-sm"
                            value={title}
                            onChange={(e) =>
                              handleDrawingTitleChange(
                                d.id,
                                e.target.value
                              )
                            }
                          />

                          {hasFile ? (
                            <div className="mt-2 text-xs text-gray-700 space-y-1">
                              <p>
                                اسم الملف داخل المربع:{" "}
                                <span className="font-semibold">
                                  {d.fileName}
                                </span>
                              </p>
                              <p>
                                رفع بواسطة: {d.uploadedBy || "-"}
                              </p>
                              <p>
                                التاريخ:{" "}
                                {formatArabicDateTime(d.uploadedAt)}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-gray-500">
                              لم يتم رفع ملف بعد لهذا المربع.
                            </p>
                          )}
                        </div>

                        <div className="w-full md:w-64 flex flex-col items-end gap-2">
                          {hasFile && d.filePath && (
                            <a
                              href={d.filePath}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-700 underline"
                            >
                              فتح الملف الحالي
                            </a>
                          )}

                          <input
                            type="file"
                            className="text-xs"
                            onChange={(e) =>
                              handleUploadDrawingFile(
                                d,
                                e.target.files?.[0] || null
                              )
                            }
                          />

                          {uploadingId === d.id && (
                            <p className="text-[10px] text-gray-500">
                              جاري رفع الملف...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* تبويب الصور (تجريبي) */}
        {activeTab === "photos" && (
          <div className="space-y-3">
            {mockPhotos.map((p) => (
              <div
                key={p.id}
                className="border rounded-xl p-3 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.date}</p>
                  {p.note && (
                    <p className="text-xs text-gray-600 mt-1">
                      ملاحظة: {p.note}
                    </p>
                  )}
                </div>
                <button className="text-xs px-3 py-1 rounded-lg border bg-gray-50 hover:bg-gray-100">
                  عرض الصورة (لاحقاً)
                </button>
              </div>
            ))}
          </div>
        )}

        {/* تبويب المحادثة (تجريبي) */}
        {activeTab === "chat" && (
          <div className="flex flex-col gap-3">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {mockMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="border rounded-xl p-2 bg-gray-50 text-sm"
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{msg.author}</span>
                    <span className="text-xs text-gray-500">
                      {msg.time}
                    </span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <textarea
                className="w-full border rounded-lg p-2 text-sm mb-2"
                rows={3}
                placeholder="اكتب رسالة (المحادثة حالياً تجريبية فقط)..."
              />
              <button className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm">
                إرسال (لاحقاً)
              </button>
            </div>
          </div>
        )}

        {/* تبويب أرشيف المخططات */}
        {activeTab === "drawingsArchive" && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm mb-2">
              أرشيف المخططات (الملفات القديمة)
            </h3>

            {loadingDrawings ? (
              <p className="text-xs text-gray-500">
                جاري تحميل الأرشيف...
              </p>
            ) : archiveDrawings.length === 0 ? (
              <p className="text-xs text-gray-500">
                لا يوجد أرشيف بعد، يظهر هنا أي ملف قديم تم استبداله
                بمخطط جديد.
              </p>
            ) : (
              <div className="space-y-3">
                {archiveDrawings.map((d) => (
                  <div
                    key={d.id}
                    className="border rounded-xl p-3 flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-semibold">{d.boxName}</p>
                      <p className="text-xs text-gray-600">
                        اسم الملف:{" "}
                        <span className="font-semibold">
                          {d.fileName}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        رفع بواسطة: {d.uploadedBy || "-"}
                      </p>
                      <p className="text-xs text-gray-500">
                        التاريخ:{" "}
                        {formatArabicDateTime(d.uploadedAt)}
                      </p>
                    </div>
                    {d.filePath && (
                      <a
                        href={d.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1 rounded-lg border bg-gray-50 hover:bg-gray-100"
                      >
                        فتح النسخة القديمة
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-sm ${
        active ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"
      }`}
    >
      {label}
    </button>
  );
}
