import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/sessions/[id]/readings - Bulk insert readings
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify session ownership
  const recordingSession = await prisma.session.findFirst({
    where: { id, userId: session.user.id, status: "recording" },
  });

  if (!recordingSession) {
    return NextResponse.json({ error: "Session not found or not recording" }, { status: 404 });
  }

  const body = await req.json();
  const readings: { dbLevel: number; timestamp: string }[] = body.readings;

  if (!Array.isArray(readings) || readings.length === 0) {
    return NextResponse.json({ error: "readings array required" }, { status: 400 });
  }

  await prisma.reading.createMany({
    data: readings.map((r) => ({
      sessionId: id,
      dbLevel: r.dbLevel,
      timestamp: new Date(r.timestamp),
    })),
  });

  // Update live stats on the session
  const stats = await prisma.reading.aggregate({
    where: { sessionId: id },
    _min: { dbLevel: true },
    _max: { dbLevel: true },
    _avg: { dbLevel: true },
  });

  await prisma.session.update({
    where: { id },
    data: {
      minDb: stats._min.dbLevel,
      maxDb: stats._max.dbLevel,
      avgDb: stats._avg.dbLevel ? Math.round(stats._avg.dbLevel * 10) / 10 : null,
    },
  });

  return NextResponse.json({ inserted: readings.length });
}

// GET /api/sessions/[id]/readings - Query readings with optional time range
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify session ownership
  const recordingSession = await prisma.session.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!recordingSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = parseInt(searchParams.get("limit") || "5000");

  const where: Record<string, unknown> = { sessionId: id };
  if (from || to) {
    where.timestamp = {};
    if (from) (where.timestamp as Record<string, Date>).gte = new Date(from);
    if (to) (where.timestamp as Record<string, Date>).lte = new Date(to);
  }

  const readings = await prisma.reading.findMany({
    where,
    orderBy: { timestamp: "asc" },
    take: limit,
    select: {
      dbLevel: true,
      timestamp: true,
    },
  });

  return NextResponse.json(readings);
}
