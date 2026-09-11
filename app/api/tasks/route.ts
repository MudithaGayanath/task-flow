import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tasks — return every task, newest first
export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}

// POST /api/tasks — create a task from { title, notes }
export async function POST(request: Request) {
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      title,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
