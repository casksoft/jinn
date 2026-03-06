"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface EmployeeData {
  name: string;
  displayName?: string;
  department?: string;
  rank?: string;
  engine?: string;
  model?: string;
  persona?: string;
  [key: string]: unknown;
}

interface SessionData {
  id: string;
  employee?: string | null;
  status?: string;
  createdAt?: string;
  source?: string;
  [key: string]: unknown;
}

const rankColors: Record<string, string> = {
  executive: "bg-purple-100 text-purple-700 border-purple-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  senior: "bg-green-100 text-green-700 border-green-200",
  employee: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

export function EmployeeDetail({ name }: { name: string }) {
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personaExpanded, setPersonaExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPersonaExpanded(false);

    Promise.all([
      api.getEmployee(name),
      api.getSessions(),
    ])
      .then(([emp, allSessions]) => {
        setEmployee(emp as EmployeeData);
        const empSessions = (allSessions as SessionData[]).filter(
          (s) => s.employee === name,
        );
        setSessions(empSessions.slice(0, 10));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        Failed to load employee: {error}
      </div>
    );
  }

  if (!employee) return null;

  const rank = employee.rank || "employee";
  const colors = rankColors[rank] || rankColors.employee;
  const persona = employee.persona || "";
  const truncatedPersona = persona.length > 200 && !personaExpanded
    ? persona.slice(0, 200) + "..."
    : persona;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {employee.displayName || employee.name}
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">{employee.name}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${colors}`}>
            {rank}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-1">
              Department
            </p>
            <p className="text-sm text-neutral-700">
              {employee.department || "None"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-1">
              Engine
            </p>
            <p className="text-sm text-neutral-700">
              {employee.engine || "claude"}{" "}
              <span className="text-neutral-400">
                / {employee.model || "default"}
              </span>
            </p>
          </div>
        </div>

        {persona && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-2">
              Persona
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
              {truncatedPersona}
            </p>
            {persona.length > 200 && (
              <button
                onClick={() => setPersonaExpanded(!personaExpanded)}
                className="text-xs text-blue-500 hover:text-blue-600 mt-1"
              >
                {personaExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-700 mb-3">
          Recent Sessions
        </h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">
            No sessions found for this employee.
          </p>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100">
            {sessions.map((session) => (
              <div key={session.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-neutral-700">
                    {session.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {session.source || "unknown"}{" "}
                    {session.createdAt
                      ? new Date(session.createdAt).toLocaleDateString()
                      : ""}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    session.status === "running"
                      ? "bg-green-50 text-green-700"
                      : session.status === "error"
                        ? "bg-red-50 text-red-700"
                        : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {session.status || "idle"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
