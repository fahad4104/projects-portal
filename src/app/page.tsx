// src/app/page.tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  // أول ما يزور المستخدم / نحوله مباشرة لصفحة الدخول
  redirect("/login");
}
