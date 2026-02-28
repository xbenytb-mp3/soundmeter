import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sessions/[id] - Session detail with stats
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const recordingSession = await prisma.session.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!recordingSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(recordingSession);
}

// PATCH /api/sessions/[id] - End session (compute final stats)
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.session.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Compute final stats from readings
  const stats = await prisma.reading.aggregate({
    where: { sessionId: id },
    _min: { dbLevel: true },
    _max: { dbLevel: true },
    _avg: { dbLevel: true },
  });

  const updated = await prisma.session.update({
    where: { id },
    data: {
      status: "completed",
      endedAt: new Date(),
      minDb: stats._min.dbLevel,
      maxDb: stats._max.dbLevel,
      avgDb: stats._avg.dbLevel ? Math.round(stats._avg.dbLevel * 10) / 10 : null,
    },
  });

  return NextResponse.json(updated);
}
