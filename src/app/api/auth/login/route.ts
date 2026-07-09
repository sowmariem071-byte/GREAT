import { NextResponse } from "next/server";
import { UserStatus } from "@prisma/client";
import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const loginUrl = new URL("/login", request.url);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== UserStatus.ACTIVE || !(await verifyPassword(password, user.passwordHash))) {
    loginUrl.searchParams.set("error", "1");
    return NextResponse.redirect(loginUrl);
  }

  await createSession(user.id);
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
