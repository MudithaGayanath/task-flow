import { prisma } from "@/lib/prisma";
import TaskBoard from "@/components/TaskBoard";
import type { Task } from "@/generated/prisma/client";

export default async function Home() {
  let tasks: Task[] = [];
  let dbError: string | null = null;

  try {
    tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    // Most likely cause on a fresh clone: DATABASE_URL isn't set yet, or
    // `prisma migrate dev` hasn't been run so the `Task` table doesn't exist.
    dbError =
      "Couldn't reach the database. Check DATABASE_URL in .env, then run `npx prisma migrate dev`.";
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <header className="mb-10 flex items-baseline justify-between border-b border-board-line pb-6">
        <h1 className="font-mono text-2xl tracking-tight text-board-text">
          TASKFLOW
        </h1>
        <p className="font-mono text-sm text-board-muted">
          {tasks.filter((t) => !t.done).length} ACTIVE / {tasks.length} TOTAL
        </p>
      </header>

      {dbError ? (
        <div className="rounded border border-board-red/40 bg-board-red/10 px-4 py-3 font-mono text-sm text-board-red">
          {dbError}
        </div>
      ) : (
        <TaskBoard initialTasks={tasks} />
      )}
    </main>
  );
}
