"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Task {
  id?: string;
  title: string;
  assignee?: string;
  priority?: string;
  status: string;
  [key: string]: unknown;
}

interface BoardData {
  name?: string;
  columns?: Record<string, Task[]>;
  tasks?: Task[];
  [key: string]: unknown;
}

const priorityColors: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-neutral-50 text-neutral-500 border-neutral-200",
};

const columnLabels: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  inProgress: "In Progress",
  done: "Done",
};

function TaskCard({ task }: { task: Task }) {
  const priorityColor = priorityColors[task.priority || "low"] || priorityColors.low;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-neutral-800 mb-2">{task.title}</p>
      <div className="flex items-center justify-between">
        {task.assignee && (
          <span className="text-xs text-neutral-500">{task.assignee}</span>
        )}
        {task.priority && (
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${priorityColor}`}
          >
            {task.priority}
          </span>
        )}
      </div>
    </div>
  );
}

function Column({ title, tasks }: { title: string; tasks: Task[] }) {
  return (
    <div className="flex-1 min-w-[220px]">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          {title}
        </h4>
        <span className="text-xs text-neutral-300">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task, idx) => (
          <TaskCard key={task.id || idx} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-neutral-300 text-center py-4">
            No tasks
          </p>
        )}
      </div>
    </div>
  );
}

export function BoardView({ department }: { department: string }) {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .getDepartmentBoard(department)
      .then((data) => setBoard(data as BoardData))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [department]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
        Loading board...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-8 text-center">
        <p className="text-sm text-neutral-500">
          No board found for {department}.
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          Tasks will appear here when the department has a board set up.
        </p>
      </div>
    );
  }

  if (!board) return null;

  // Support both { columns: { todo: [], ... } } and { tasks: [] } shapes
  let columns: Record<string, Task[]>;

  if (board.columns && typeof board.columns === "object") {
    columns = board.columns;
  } else if (Array.isArray(board.tasks)) {
    columns = {
      todo: board.tasks.filter((t) => t.status === "todo"),
      in_progress: board.tasks.filter(
        (t) => t.status === "in_progress" || t.status === "inProgress",
      ),
      done: board.tasks.filter((t) => t.status === "done"),
    };
  } else {
    columns = { todo: [], in_progress: [], done: [] };
  }

  const orderedKeys = ["todo", "in_progress", "inProgress", "done"];
  const displayColumns = orderedKeys
    .filter((key) => columns[key] !== undefined)
    .map((key) => ({
      key,
      title: columnLabels[key] || key,
      tasks: columns[key],
    }));

  // If no ordered keys found, show whatever columns exist
  if (displayColumns.length === 0) {
    for (const [key, tasks] of Object.entries(columns)) {
      displayColumns.push({
        key,
        title: columnLabels[key] || key,
        tasks,
      });
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight mb-1 capitalize">
        {department}
      </h2>
      <p className="text-sm text-neutral-500 mb-6">Department board</p>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {displayColumns.map((col) => (
          <Column key={col.key} title={col.title} tasks={col.tasks} />
        ))}
      </div>
    </div>
  );
}
