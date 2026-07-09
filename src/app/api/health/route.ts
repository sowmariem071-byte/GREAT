import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function envPresence() {
  return {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DIRECT_URL: Boolean(process.env.DIRECT_URL),
    POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
    POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  };
}

function sanitizeError(error: unknown) {
  if (!(error instanceof Error)) {
    return { name: "UnknownError", message: "Unknown database error" };
  }

  const withCode = error as Error & { code?: string };
  return {
    name: error.name,
    code: withCode.code,
    message: error.message.split("\n")[0].slice(0, 240),
  };
}

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const targetCount = await prisma.dailyTarget.count();

    return NextResponse.json({
      ok: true,
      database: "connected",
      userCount,
      targetCount,
      env: envPresence(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        env: envPresence(),
        error: sanitizeError(error),
      },
      { status: 500 },
    );
  }
}
