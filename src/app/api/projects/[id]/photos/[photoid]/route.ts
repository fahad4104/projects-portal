import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/projects/[id]/photos/[photoId]
export async function DELETE(
  req: NextRequest,
  context: { params: { id?: string; photoId?: string } }
) {
  try {
    // 1) نحاول نقرأ photoId من params
    let photoId = context.params?.photoId;

    // 2) لو ما لقيناه (وهو اللي واضح أنه يصير)، نأخذه من الـ URL مباشرة
    if (!photoId) {
      const url = new URL(req.url);
      const segments = url.pathname.split("/").filter(Boolean); // يحذف الفراغات
      photoId = segments[segments.length - 1]; // آخر جزء في المسار هو الـ id
    }

    // 3) لو بعد كل هذا still ما عندنا photoId → نرجّع خطأ بسيط وما نحذف شيء
    if (!photoId) {
      console.error("DELETE photo: photoId is missing");
      return NextResponse.json(
        { message: "معرّف الصورة غير موجود في الرابط" },
        { status: 400 }
      );
    }

    console.log("🔹 Deleting photo with id:", photoId);

    // 4) نحذف أي سجل بهذا الـ id (id فريد @id @default(cuid()))
    const result = await prisma.projectPhoto.deleteMany({
      where: { id: photoId },
    });

    console.log("Deleted photos count:", result.count);

    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch (error: any) {
    console.error(
      "❌ DELETE /api/projects/[id]/photos/[photoId] error",
      error?.code,
      error?.message ?? error
    );

    return NextResponse.json(
      { message: "فشل في حذف الصورة" },
      { status: 500 }
    );
  }
}
