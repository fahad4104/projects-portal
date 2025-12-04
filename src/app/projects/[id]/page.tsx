"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCurrentUser } from "@/contexts/UserContext";

// حالة المهمة في الواجهة فقط
type TaskStatusClient = "pending" | "in_progress" | "done";

type Task = {
  id: string;
  title: string;
  status: TaskStatusClient;
  owner: string;          // نخزن هنا معرف المستخدم (مثلاً الإيميل)
  assignedTo: string[];   // قائمة معرفات المستخدمين الموجهة لهم المهمة
  visibleTo: string[];    // قائمة معرفات المستخدمين اللي يقدرون يشوفون المهمة
  createdAt: string;
  completedAt?: string | null;
};

type Tab = "chat" | "drawings" | "photos" | "tasks" | "drawingsArchive";

type ProjectInfo = {
  id?: string;
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

type ProjectPhoto = {
  id: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
};

type ChatMessage = {
  id: string;
  authorRole: string;
  content: string;
  createdAt: string;
};

type ProjectMember = {
  id: string;
  name: string | null;
  email: string;
  roleLabel: string | null;
};

const mockMessages = [
  {
    id: "M-001",
    author: "المالك",
    content: "السلام عليكم، كيف التقدم في أعمال السقف؟",
    time: "10:15 AM",
  },
  {
    id: "M-002",
    author: "المقاول",
    content: "وعليكم السلام، اليوم نكمل نجارة السقف إن شاء الله.",
    time: "10:20 AM",
  },
];

function formatArabicDateTime(isoString: string) {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("ar-AE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

const ProjectPage = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const { user, logout } = useCurrentUser();

  const [project, setProject] = useState<ProjectInfo | null>(null);

  // المستخدم الحالي كـ "مفتاح" نستخدمه في المهام (الإيميل الأفضل لأنه فريد)
  const currentUserKey = user?.email ?? "";
  const currentUserLabel = user?.name ?? user?.email ?? "مستخدم";

  // أعضاء المشروع
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // المهام
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // التبويب الحالي
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  // إضافة مهمة جديدة
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string[]>([]);
  const [newTaskVisibleTo, setNewTaskVisibleTo] = useState<string[]>([]);

  // المخططات
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [archiveDrawings, setArchiveDrawings] = useState<DrawingItem[]>([]);
  const [loadingDrawings, setLoadingDrawings] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [drawingTitles, setDrawingTitles] = useState<Record<string, string>>(
    {}
  );

  // المحادثة (للمستقبل)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // صور المشروع
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  // دعوة مستخدمين للمشروع
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleLabel, setInviteRoleLabel] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  // حماية: لو ما في مستخدم، رجع لصفحة الدخول
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  // تحميل بيانات المشروع
  useEffect(() => {
    if (projectId) {
      fetchProjectData(projectId);
    }
  }, [projectId]);

  async function fetchMessages(projectId: string) {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`);
      const data = await res.json();

      if (!res.ok) {
        console.error("Error loading messages", data);
        return;
      }

      const list: ChatMessage[] = data.messages ?? data ?? [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error loading messages", error);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function fetchProjectData(projectId: string) {
    setLoadingTasks(true);
    setLoadingDrawings(true);
    setLoadingPhotos(true);
    setLoadingMembers(true);

    try {
      const [
        projRes,
        tasksRes,
        drawingsRes,
        photosRes,
        membersRes,
      ] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`),
        fetch(`/api/projects/${projectId}/drawings`),
        fetch(`/api/projects/${projectId}/photos`),
        fetch(`/api/projects/${projectId}/members`),
      ]);

      const [
        projData,
        tasksData,
        drawingsData,
        photosData,
        membersData,
      ] = await Promise.all([
        projRes.json(),
        tasksRes.json(),
        drawingsRes.json(),
        photosRes.json(),
        membersRes.json(),
      ]);

      if (projRes.ok) {
        setProject(projData.project ?? projData ?? null);
      } else {
        console.error("Error loading project", projData);
      }

      if (tasksRes.ok) {
        const list: Task[] = tasksData.tasks ?? tasksData ?? [];
        setTasks(Array.isArray(list) ? list : []);
      } else {
        console.error("Error loading tasks", tasksData);
      }

      if (drawingsRes.ok) {
        const active: DrawingItem[] = drawingsData.active ?? [];
        const archive: DrawingItem[] = drawingsData.archive ?? [];
        setDrawings(active);
        setArchiveDrawings(archive);

        const titles: Record<string, string> = {};
        active.forEach((d) => {
          titles[d.id] = d.boxName;
        });
        setDrawingTitles(titles);
      } else {
        console.error("Error loading drawings", drawingsData);
      }

      if (photosRes.ok) {
        const list: ProjectPhoto[] = photosData.photos ?? [];
        setPhotos(Array.isArray(list) ? list : []);
      } else {
        console.error("Error loading photos", photosData);
      }

      if (membersRes.ok) {
        const list: ProjectMember[] = membersData.members ?? membersData ?? [];
        setMembers(Array.isArray(list) ? list : []);
      } else {
        console.error("Error loading members", membersData);
      }
    } catch (error) {
      console.error("Error loading data", error);
    } finally {
      setLoadingTasks(false);
      setLoadingDrawings(false);
      setLoadingPhotos(false);
      setLoadingMembers(false);
    }
  }

  // دوال مساعدة لأسماء الأعضاء
  const getMemberDisplayName = (key: string) => {
    const m = members.find((mm) => mm.email === key);
    return m?.name || key;
  };

  const getMembersDisplayNames = (keys: string[]) =>
    keys.map((k) => getMemberDisplayName(k));

  // تغيير "موجهة لـ"
  const handleAssignedToChange = (memberKey: string) => {
    setNewTaskAssignedTo((prev) =>
      prev.includes(memberKey)
        ? prev.filter((r) => r !== memberKey)
        : [...prev, memberKey]
    );
  };

  // تغيير "مين يشوف المهمة"
  const handleVisibleToChange = (memberKey: string) => {
    setNewTaskVisibleTo((prev) =>
      prev.includes(memberKey)
        ? prev.filter((r) => r !== memberKey)
        : [...prev, memberKey]
    );
  };

  // إضافة مهمة جديدة
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !currentUserKey) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // نرسل الإيميل كمُعرّف لصاحب المهمة
          ownerRoleLabel: currentUserKey,
          assignedToLabels: newTaskAssignedTo,
          visibleToLabels: newTaskVisibleTo,
          title: newTaskTitle.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error adding task", data);
        alert("خطأ في إنشاء المهمة: " + (data?.message ?? "تحقق من الكونسول"));
        return;
      }

      const newTask: Task = data.task;
      setTasks((prev) => [newTask, ...prev]);
      setNewTaskTitle("");
      setNewTaskAssignedTo([]);
      setNewTaskVisibleTo([]);
    } catch (error) {
      console.error("Error adding task", error);
      alert("حدث خطأ غير متوقع في إضافة المهمة، راجع الكونسول");
    }
  };

  // إكمال مهمة
  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "done" }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("Error completing task", data);
        alert("خطأ في إكمال المهمة");
        return;
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: "done", completedAt: new Date().toISOString() }
            : t
        )
      );
    } catch (error) {
      console.error("Error completing task", error);
      alert("حدث خطأ غير متوقع في إكمال المهمة");
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const completedTasks = tasks.filter((t) => t.status === "done");

  const canSeeTask = (t: Task) => {
    if (!currentUserKey) return true;
    if (t.visibleTo && t.visibleTo.length > 0) {
      return t.visibleTo.includes(currentUserKey);
    }
    return true;
  };

  const visibleActiveTasks = activeTasks.filter(canSeeTask);
  const visibleCompletedTasks = completedTasks.filter(canSeeTask);

  // ====== المخططات ======

  const handleCreateDrawingBox = async () => {
    const title = window.prompt("اسم المربع (مثال: مخطط معماري):");
    if (!title || !title.trim()) return;

    const boxTitle = title.trim();
    const normalizedTitle = boxTitle.toLowerCase();

    const existing = drawings.find((d) => {
      const t = (drawingTitles[d.id] ?? d.boxName ?? "").trim();
      return t.toLowerCase() === normalizedTitle;
    });

    if (existing) {
      const replace = window.confirm(
        "يوجد مربع مخطط آخر بنفس الاسم.\n\n" +
          "هل تريد نقل القديم (بملفه إن وجد) إلى الأرشيف وإنشاء مربع جديد بنفس الاسم؟\n\n" +
          "اضغط (إلغاء) لتغيير الاسم."
      );

      if (!replace) {
        alert("اختر اسم جديد للمخطط.");
        return;
      }

      try {
        const resArchive = await fetch(
          `/api/projects/${projectId}/drawings/${existing.id}`,
          {
            method: "DELETE",
          }
        );

        if (!resArchive.ok) {
          let data: any = null;
          try {
            data = await resArchive.json();
          } catch {}
          console.error("Error archiving drawing", data);
          alert("تعذر نقل المخطط القديم للأرشيف.");
          return;
        }
      } catch (err) {
        console.error("Error archiving drawing", err);
        alert("تعذر نقل المخطط القديم للأرشيف.");
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("boxName", boxTitle);
      formData.append("uploadedBy", currentUserLabel);

      const res = await fetch(`/api/projects/${projectId}/drawings`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Error creating drawing box", data);
        alert(data?.message ?? "فشل في إنشاء المربع");
        return;
      }

      await fetchProjectData(projectId);
    } catch (error) {
      console.error("Error creating drawing box", error);
      alert("حدث خطأ غير متوقع أثناء إنشاء المربع");
    }
  };

  // رفع ملف لمخطط معيّن
  const handleUploadDrawing = async (
    drawing: DrawingItem,
    file: File
  ) => {
    const boxTitle =
      drawingTitles[drawing.id] ?? drawing.boxName ?? "مخطط";

    const hasExistingFile = !!drawing.fileName;

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
      formData.append("uploadedBy", currentUserLabel);
      formData.append("drawingId", drawing.id);
      formData.append("file", file);

      const res = await fetch(
        `/api/projects/${projectId}/drawings`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("Error uploading drawing", data);
        alert(data?.message ?? "فشل في رفع الملف");
        return;
      }

      await fetchProjectData(projectId);
    } catch (error) {
      console.error("Error uploading drawing", error);
      alert("حدث خطأ أثناء رفع الملف");
    } finally {
      setUploadingId(null);
    }
  };

  // نقل مخطط للأرشيف
  const handleArchiveDrawing = async (drawingId: string) => {
    const ok = window.confirm(
      "سيتم نقل هذا المخطط إلى الأرشيف، هل أنت متأكد؟"
    );
    if (!ok) return;

    try {
      const res = await fetch(
        `/api/projects/${projectId}/drawings/${drawingId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("Error archiving drawing", data);
        alert(data?.error ?? "فشل في نقل المخطط للأرشيف");
        return;
      }

      await fetchProjectData(projectId);
    } catch (error) {
      console.error("Error archiving drawing", error);
      alert("حدث خطأ أثناء نقل المخطط للأرشيف");
    }
  };

  // فتح ملف مخطط
  const handleDownloadDrawing = (drawing: DrawingItem) => {
    if (!drawing.filePath) return;
    window.open(drawing.filePath, "_blank");
  };

  const handleDrawingTitleChange = (drawingId: string, title: string) => {
    setDrawingTitles((prev) => ({
      ...prev,
      [drawingId]: title,
    }));
  };

  // ===== صور المشروع =====

  const handleUploadPhoto = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/projects/${projectId}/photos`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Error uploading photo", data);
        alert(data?.message ?? "فشل في رفع الصورة");
        return;
      }

      await fetchProjectData(projectId);
    } catch (error) {
      console.error("Error uploading photo", error);
      alert("حدث خطأ أثناء رفع الصورة");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const ok = window.confirm("سيتم حذف الصورة نهائياً، هل أنت متأكد؟");
    if (!ok) return;

    try {
      const res = await fetch(
        `/api/projects/${projectId}/photos/${photoId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("Error deleting photo", data);
        alert(data?.message ?? "فشل في حذف الصورة");
        return;
      }

      await fetchProjectData(projectId);
    } catch (error) {
      console.error("Error deleting photo", error);
      alert("حدث خطأ أثناء حذف الصورة");
    }
  };

  // ===== دعوة مستخدمين للمشروع =====

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      setInviteError("يرجى إدخال البريد الإلكتروني للمستخدم");
      return;
    }

    setInviteError(null);
    setInviteSuccess(null);

    try {
      setInviteLoading(true);

      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          roleLabel: inviteRoleLabel.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data?.error || "فشل في إضافة المستخدم للمشروع");
        return;
      }

      setInviteSuccess("تم إضافة المستخدم للمشروع بنجاح");
      setInviteEmail("");
      setInviteRoleLabel("");

      // بعد الإضافة حدّث قائمة الأعضاء
      fetchProjectData(projectId);
    } catch (error) {
      console.error("Error inviting member", error);
      setInviteError("حدث خطأ غير متوقع أثناء إرسال الدعوة");
    } finally {
      setInviteLoading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="p-4 text-center">
        <p>لا يوجد مشروع محدد.</p>
      </div>
    );
  }

  // لو ما في ولا عضو لسه (مش مشكلة، نستخدم المستخدم الحالي كخيار وحيد)
  const memberOptions: ProjectMember[] =
    members.length > 0
      ? members
      : currentUserKey
      ? [{ id: "self", name: currentUserLabel, email: currentUserKey, roleLabel: null }]
      : [];

  return (
    <div className="min-h-screen bg-slate-100 text-right">
      {/* الهيدر */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">بوابة المشاريع </h1>
          <p className="text-xs text-gray-500">
            متابعة مشروع:{" "}
            <span className="font-semibold">
              {project?.code ?? projectId} - {project?.name ?? "مشروع"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-xs text-right">
            <p className="text-gray-500">المستخدم:</p>
            <p className="font-semibold">{currentUserLabel}</p>
            <button
              onClick={logout}
              className="mt-1 text-[11px] text-red-600 hover:underline"
            >
              تسجيل الخروج
            </button>
          </div>

          <Link
            href="/projects"
            className="text-xs text-blue-600 hover:underline"
          >
            ← الرجوع لقائمة المشاريع
          </Link>
        </div>
      </header>

      {/* المحتوى */}
      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* كرت معلومات المشروع */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold">
                {project?.name ?? "مشروع"}
              </p>
              <p className="text-xs text-gray-500">
                رقم المشروع:{" "}
                <span className="font-mono">
                  {project?.code ?? projectId}
                </span>
              </p>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                المالك:{" "}
                <span className="font-semibold">
                  {project?.ownerName ?? "-"}
                </span>
              </p>
              <p>
                المقاول:{" "}
                <span className="font-semibold">
                  {project?.contractorName ?? "-"}
                </span>
              </p>
              <p>
                الاستشاري:{" "}
                <span className="font-semibold">
                  {project?.consultantName ?? "-"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* كرت مشاركة المشروع مع مستخدمين آخرين */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">
              مشاركة المشروع مع مستخدمين آخرين
            </h3>
            <button
              onClick={() => setShowInviteForm((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              {showInviteForm ? "إخفاء نموذج الإضافة" : "+ إضافة مستخدم للمشروع"}
            </button>
          </div>

          {showInviteForm && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="md:col-span-1">
                  <label className="block text-xs mb-1">
                    البريد الإلكتروني للمستخدم
                  </label>
                  <input
                    type="email"
                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                    placeholder="example@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs mb-1">
                    وصف الدور في المشروع (اختياري)
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                    placeholder="مالك المشروع / المقاول الرئيسي / الاستشاري..."
                    value={inviteRoleLabel}
                    onChange={(e) => setInviteRoleLabel(e.target.value)}
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button
                    onClick={handleInviteMember}
                    disabled={inviteLoading}
                    className="w-full md:w-auto px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-60 hover:bg-blue-700"
                  >
                    {inviteLoading ? "جارٍ الإضافة..." : "إضافة كمشارك"}
                  </button>
                </div>
              </div>

              {inviteError && (
                <p className="text-[11px] text-red-600 mt-1">
                  {inviteError}
                </p>
              )}
              {inviteSuccess && (
                <p className="text-[11px] text-green-600 mt-1">
                  {inviteSuccess}
                </p>
              )}
            </>
          )}

          <p className="text-[11px] text-gray-500 mt-1">
            يمكن لأي مستخدم تمت إضافته هنا الدخول للمشروع من حسابه واستخدام
            تبويبات المهام، المخططات، الصور وغيرها.
          </p>
        </div>

        {/* التبويبات */}
        <div className="bg-white rounded-xl shadow-sm mb-3">
          <div className="flex overflow-x-auto text-xs border-b">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-3 py-2 whitespace-nowrap ${
                activeTab === "tasks"
                  ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              المهام
            </button>
            <button
              onClick={() => setActiveTab("drawings")}
              className={`px-3 py-2 whitespace-nowrap ${
                activeTab === "drawings"
                  ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              المخططات
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`px-3 py-2 whitespace-nowrap ${
                activeTab === "photos"
                  ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              صور المشروع
            </button>
            <button
              onClick={() => setActiveTab("drawingsArchive")}
              className={`px-3 py-2 whitespace-nowrap ${
                activeTab === "drawingsArchive"
                  ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              أرشيف المخططات
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-2 whitespace-nowrap ${
                activeTab === "chat"
                  ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              محادثة سريعة (شكلي)
            </button>
          </div>

          <div className="p-3 text-sm">
            {/* تبويب المهام */}
            {activeTab === "tasks" && (
              <div className="space-y-4">
                {/* إضافة مهمة */}
                <div className="border rounded-2xl p-3 bg-gray-50 space-y-2 text-sm">
                  <h3 className="font-semibold text-sm mb-1">
                    إضافة مهمة جديدة
                  </h3>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-1.5 text-sm mb-2"
                    placeholder="عنوان المهمة..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="text-xs">
                      <label className="block mb-1">
                        موجهة لـ
                      </label>
                      <div className="flex flex-col gap-1 bg-white p-2 border rounded-lg">
                        {memberOptions.map((m) => {
                          const key = m.email;
                          const label =
                            (m.name || m.email) +
                            (m.roleLabel ? ` – ${m.roleLabel}` : "");

                          return (
                            <label
                              key={key}
                              className="flex items-center gap-2 text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={newTaskAssignedTo.includes(key)}
                                onChange={() => handleAssignedToChange(key)}
                              />
                              {label}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block mb-1">
                        اظهار لـ :
                      </label>
                      <div className="flex flex-col gap-1 bg-white p-2 border rounded-lg">
                        {memberOptions.map((m) => {
                          const key = m.email;
                          const label =
                            (m.name || m.email) +
                            (m.roleLabel ? ` – ${m.roleLabel}` : "");

                          return (
                            <label
                              key={key}
                              className="flex items-center gap-2 text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={newTaskVisibleTo.includes(key)}
                                onChange={() => handleVisibleToChange(key)}
                              />
                              {label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleAddTask}
                      className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700"
                    >
                      إضافة المهمة
                    </button>
                  </div>
                </div>

                {/* المهام الحالية */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">
                    المهام الحالية
                  </h3>
                  {loadingTasks ? (
                    <p className="text-xs text-gray-500">
                      جارٍ تحميل المهام...
                    </p>
                  ) : visibleActiveTasks.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      لا توجد مهام حالية متاحة لك.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {visibleActiveTasks.map((t) => {
                        const canComplete =
                          t.assignedTo && t.assignedTo.length > 0
                            ? t.assignedTo.includes(currentUserKey)
                            : t.visibleTo.includes(currentUserKey);

                        const assignedNames =
                          t.assignedTo && t.assignedTo.length > 0
                            ? getMembersDisplayNames(t.assignedTo)
                            : [];

                        const visibleNames =
                          t.visibleTo && t.visibleTo.length > 0
                            ? getMembersDisplayNames(t.visibleTo)
                            : [];

                        return (
                          <div
                            key={t.id}
                            className="border rounded-xl p-3 flex items-center justify-between text-sm"
                          >
                            <div>
                              <p className="font-semibold">{t.title}</p>
                              <p className="text-xs text-gray-500">
                                موجهة إلى:{" "}
                                {assignedNames.length > 0
                                  ? assignedNames.join("، ")
                                  : "غير محددة"}{" "}
                                • صاحب المهمة:{" "}
                                {getMemberDisplayName(t.owner)}
                              </p>
                              <p className="text-xs text-gray-500">
                                تاريخ الإضافة:{" "}
                                {formatArabicDateTime(t.createdAt)}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <button
                                onClick={() => handleCompleteTask(t.id)}
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
                                  فقط الأشخاص الموجهة لهم المهمة (
                                  {(assignedNames.length > 0
                                    ? assignedNames
                                    : visibleNames
                                  ).join("، ")}
                                  ) يقدرون يكملونها
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* المهام المكتملة */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">
                    المهام المكتملة
                  </h3>
                  {visibleCompletedTasks.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      لا توجد مهام مكتملة متاحة لك.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {visibleCompletedTasks.map((t) => {
                        const assignedNames =
                          t.assignedTo && t.assignedTo.length > 0
                            ? getMembersDisplayNames(t.assignedTo)
                            : [];

                        return (
                          <div
                            key={t.id}
                            className="border rounded-xl p-3 flex items-center justify-between text-sm bg-green-50"
                          >
                            <div>
                              <p className="font-semibold line-through">
                                {t.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                موجهة إلى:{" "}
                                {assignedNames.length > 0
                                  ? assignedNames.join("، ")
                                  : "غير محددة"}{" "}
                                • صاحب المهمة:{" "}
                                {getMemberDisplayName(t.owner)}
                              </p>
                              <p className="text-xs text-gray-500">
                                تاريخ الإضافة:{" "}
                                {formatArabicDateTime(t.createdAt)}
                              </p>
                              {t.completedAt && (
                                <p className="text-xs text-gray-500">
                                  تاريخ الإكمال:{" "}
                                  {formatArabicDateTime(t.completedAt)}
                                </p>
                              )}
                            </div>
                            <span className="text-green-700 font-bold">
                              ✓
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* تبويب المخططات */}
            {activeTab === "drawings" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">
                    المخططات الحالية
                  </h3>
                  <button
                    onClick={handleCreateDrawingBox}
                    className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    + إضافة مخطط جديد
                  </button>
                </div>

                {loadingDrawings ? (
                  <p className="text-xs text-gray-500">
                    جارٍ تحميل المخططات...
                  </p>
                ) : drawings.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    لا توجد مخططات بعد، اضغط على زر "إضافة مخطط جديد"
                    أو ارفع ملفًا لمخطط.
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
                              <p className="font-semibold text-sm mb-1">
                                {title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {hasFile
                                  ? `ملف حالي: ${d.fileName}`
                                  : "لا يوجد ملف مرفق بعد"}
                              </p>
                              {d.uploadedAt && (
                                <p className="text-xs text-gray-400">
                                  آخر رفع:{" "}
                                  {formatArabicDateTime(d.uploadedAt)}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <label className="text-xs">
                                <span className="mr-2 border rounded-lg px-3 py-1 bg-white cursor-pointer hover:bg-gray-100">
                                  اختر ملفات
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  multiple
                                  onChange={(e) => {
                                    const files = Array.from(
                                      e.target.files ?? []
                                    );
                                    if (files.length === 0) return;

                                    files.forEach((file) => {
                                      handleUploadDrawing(d, file);
                                    });

                                    e.target.value = "";
                                  }}
                                />
                              </label>

                              <div className="flex gap-2">
                                {hasFile && (
                                  <button
                                    onClick={() =>
                                      handleDownloadDrawing(d)
                                    }
                                    className="text-xs px-3 py-1 rounded-lg border bg-white hover:bg-gray-100"
                                  >
                                    فتح الملف
                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    handleArchiveDrawing(d.id)
                                  }
                                  className="text-xs px-3 py-1 rounded-lg border bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                  نقل للأرشيف
                                </button>
                              </div>

                              {uploadingId === d.id && (
                                <p className="text-[10px] text-blue-500">
                                  جارٍ رفع الملف...
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

            {/* تبويب صور المشروع */}
            {activeTab === "photos" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">صور المشروع</h3>

                  <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 text-xs">
                    + إضافة صور
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length === 0) return;
                        files.forEach((file) => handleUploadPhoto(file));
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {loadingPhotos ? (
                  <p className="text-xs text-gray-500">
                    جارٍ تحميل الصور...
                  </p>
                ) : photos.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    لا توجد صور بعد، استخدم زر "إضافة صورة" لرفع صور
                    المشروع.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="border rounded-lg overflow-hidden bg-gray-50 flex flex-col"
                      >
                        <div
                          className="relative w-full h-28 bg-black/5 cursor-pointer"
                          onClick={() =>
                            window.open(photo.filePath, "_blank")
                          }
                        >
                          <Image
                            src={photo.filePath}
                            alt={photo.fileName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>

                        <div className="p-2 flex-1 flex flex-col justify-between">
                          <p className="text-[11px] font-semibold truncate">
                            {photo.fileName}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {formatArabicDateTime(photo.uploadedAt)}
                          </p>
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="mt-1 text-[10px] text-red-600 hover:text-red-700 self-start"
                          >
                            حذف الصورة
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* تبويب أرشيف المخططات */}
            {activeTab === "drawingsArchive" && (
              <div className="space-y-3">
                {loadingDrawings ? (
                  <p className="text-xs text-gray-500">
                    جارٍ تحميل أرشيف المخططات...
                  </p>
                ) : archiveDrawings.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    لا توجد مخططات في الأرشيف.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {archiveDrawings.map((d) => (
                      <div
                        key={d.id}
                        className="border rounded-xl p-3 text-sm bg-white"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {d.boxName ?? "مخطط"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {d.fileName
                                ? `اسم الملف: ${d.fileName}`
                                : "لا يوجد ملف محفوظ"}
                            </p>
                            {d.uploadedAt && (
                              <p className="text-xs text-gray-400">
                                تاريخ النقل للأرشيف:{" "}
                                {formatArabicDateTime(d.uploadedAt)}
                              </p>
                            )}
                          </div>
                          {d.filePath && (
                            <button
                              onClick={() => handleDownloadDrawing(d)}
                              className="text-xs px-3 py-1 rounded-lg border bg-white hover:bg-gray-100"
                            >
                              فتح الملف
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* تبويب المحادثة */}
            {activeTab === "chat" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-2">
                  هذا تبويب شكلي للمستقبل، حاليًا يظهر محادثة تجريبية فقط.
                </p>
                <div className="border rounded-xl p-3 bg-gray-50 space-y-2 text-sm">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-white rounded-lg p-2 border"
                    >
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{msg.author}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectPage;
