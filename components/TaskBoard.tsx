"use client";

import { useState, useTransition } from "react";
import type { Task } from "@/generated/prisma/client";

export default function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, notes }),
    });

    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
      setTitle("");
      setNotes("");
    }
  }

  function toggleDone(task: Task) {
    // Update the screen immediately, then confirm with the server.
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    );
    startTransition(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !task.done }),
      });
    });
  }

  function removeTask(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    });
  }

  return (
    <div>
      <form onSubmit={addTask} className="mb-10 flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task"
          className="border-b border-board-line bg-transparent py-2 text-board-text placeholder:text-board-muted focus:border-board-amber focus:outline-none"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="border-b border-board-line bg-transparent py-2 text-sm text-board-text placeholder:text-board-muted focus:border-board-amber focus:outline-none"
        />
        <button
          type="submit"
          className="self-start border border-board-line px-4 py-2 font-mono text-sm text-board-text transition-colors hover:border-board-amber hover:text-board-amber"
        >
          Log task
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="font-mono text-sm text-board-muted">
          Nothing logged yet.
        </p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start justify-between gap-4 border-t border-board-line py-4 last:border-b"
            >
              <div className="min-w-0">
                <button
                  onClick={() => toggleDone(task)}
                  className={`text-left text-base ${
                    task.done
                      ? "text-board-muted line-through"
                      : "text-board-text"
                  }`}
                >
                  {task.title}
                </button>
                {task.notes && (
                  <p className="mt-1 text-sm text-board-muted">{task.notes}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`font-mono text-xs tracking-wide ${
                    task.done ? "text-board-green" : "text-board-amber"
                  }`}
                >
                  {task.done ? "DONE" : "ACTIVE"}
                </span>
                <button
                  onClick={() => removeTask(task.id)}
                  className="font-mono text-xs text-board-muted hover:text-board-red"
                  aria-label={`Delete ${task.title}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isPending && (
        <p className="mt-4 font-mono text-xs text-board-muted">Syncing…</p>
      )}
    </div>
  );
}
