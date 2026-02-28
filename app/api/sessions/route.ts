import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/sessions - Create new recording session
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const newSession = await prisma.session.create({
    data: {
      userId: session.user.id,
      title: body.title || `Session ${new Date().toLocaleString()}`,
      status: "recording",
    },
  });

  return NextResponse.json(newSession, { status: 201 });
}

// GET /api/sessions - List user's sessions
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      title: true,
      startedAt: true,
      endedAt: true,
      minDb: true,
      maxDb: true,
      avgDb: true,
      status: true,
    },
  });

  return NextResponse.json(sessions);
}
