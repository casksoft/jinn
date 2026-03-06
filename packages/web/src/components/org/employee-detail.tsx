"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Employee } from "@/lib/api";

interface SessionData {
  id: string;
  employee?: string | null;
  status?: string;
  createdAt?: string;
  source?: string;
  [key: string]: unknown;
}

const RANK_EMOJI: Record<string, string> = {
  executive: "\uD83C\uDFAF",
  manager: "\uD83D\uDCCB",
  senior: "\u2B50",
  employee: "\uD83D\uDC64",
};

function RankBadge({ rank }: { rank: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    executive: {
      bg: "color-mix(in srgb, var(--system-purple) 15%, transparent)",
      text: "var(--system-purple)",
    },
    manager: {
      bg: "color-mix(in srgb, var(--system-blue) 15%, transparent)",
      text: "var(--system-blue)",
    },
    senior: {
      bg: "color-mix(in srgb, var(--system-green) 15%, transparent)",
      text: "var(--system-green)",
    },
    employee: {
      bg: "var(--fill-tertiary)",
      text: "var(--text-tertiary)",
    },
  };
  const c = colors[rank] || colors.employee;

  return (
    <span
      style={{
        fontSize: "var(--text-caption2)",
        fontWeight: "var(--weight-semibold)",
        color: c.text,
        background: c.bg,
        padding: "2px 10px",
        borderRadius: 10,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
      }}
    >
      {rank}
    </span>
  );
}

export function EmployeeDetail({ name }: { name: string }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personaExpanded, setPersonaExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPersonaExpanded(false);

    Promise.all([api.getEmployee(name), api.getSessions()])
      .then(([emp, allSessions]) => {
        setEmployee(emp);
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 256,
          color: "var(--text-tertiary)",
          fontSize: "var(--text-caption1)",
        }}
      >
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          borderRadius: "var(--radius-md, 12px)",
          background: "color-mix(in srgb, var(--system-red) 10%, transparent)",
          border: "1px solid color-mix(in srgb, var(--system-red) 30%, transparent)",
          padding: "var(--space-3) var(--space-4)",
          fontSize: "var(--text-caption1)",
          color: "var(--system-red)",
        }}
      >
        Failed to load employee: {error}
      </div>
    );
  }

  if (!employee) return null;

  const rank = employee.rank || "employee";
  const emoji = RANK_EMOJI[rank] || RANK_EMOJI.employee;
  const persona = employee.persona || "";
  const truncatedPersona =
    persona.length > 200 && !personaExpanded
      ? persona.slice(0, 200) + "..."
      : persona;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Main info card */}
      <div
        style={{
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--separator)",
          background: "var(--material-regular)",
          padding: "var(--space-6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "var(--space-4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
            <div>
              <h2
                style={{
                  fontSize: "var(--text-title2)",
                  fontWeight: "var(--weight-bold)",
                  letterSpacing: "var(--tracking-tight)",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {employee.displayName || employee.name}
              </h2>
              <p
                style={{
                  fontSize: "var(--text-caption1)",
                  color: "var(--text-tertiary)",
                  margin: "2px 0 0",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {employee.name}
              </p>
            </div>
          </div>
          <RankBadge rank={rank} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4)",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "var(--text-caption2)",
                fontWeight: "var(--weight-semibold)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-wide)",
                color: "var(--text-tertiary)",
                marginBottom: "var(--space-1)",
              }}
            >
              Department
            </p>
            <p
              style={{
                fontSize: "var(--text-body)",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {employee.department || "None"}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: "var(--text-caption2)",
                fontWeight: "var(--weight-semibold)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-wide)",
                color: "var(--text-tertiary)",
                marginBottom: "var(--space-1)",
              }}
            >
              Engine
            </p>
            <p
              style={{
                fontSize: "var(--text-body)",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {employee.engine || "claude"}{" "}
              <span style={{ color: "var(--text-tertiary)" }}>
                / {employee.model || "default"}
              </span>
            </p>
          </div>
        </div>

        {persona && (
          <div
            style={{
              marginTop: "var(--space-4)",
              paddingTop: "var(--space-4)",
              borderTop: "1px solid var(--separator)",
            }}
          >
            <p
              style={{
                fontSize: "var(--text-caption2)",
                fontWeight: "var(--weight-semibold)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-wide)",
                color: "var(--text-tertiary)",
                marginBottom: "var(--space-2)",
              }}
            >
              Persona
            </p>
            <p
              style={{
                fontSize: "var(--text-body)",
                color: "var(--text-secondary)",
                lineHeight: "var(--leading-relaxed)",
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
              {truncatedPersona}
            </p>
            {persona.length > 200 && (
              <button
                onClick={() => setPersonaExpanded(!personaExpanded)}
                style={{
                  fontSize: "var(--text-caption1)",
                  color: "var(--accent)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  marginTop: "var(--space-1)",
                }}
              >
                {personaExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      <div>
        <h3
          style={{
            fontSize: "var(--text-caption1)",
            fontWeight: "var(--weight-semibold)",
            letterSpacing: "var(--tracking-wide)",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginBottom: "var(--space-3)",
          }}
        >
          Recent Sessions
        </h3>
        {sessions.length === 0 ? (
          <p
            style={{
              fontSize: "var(--text-caption1)",
              color: "var(--text-tertiary)",
              textAlign: "center",
              padding: "var(--space-6) 0",
            }}
          >
            No sessions found for this employee.
          </p>
        ) : (
          <div
            style={{
              borderRadius: "var(--radius-lg, 16px)",
              border: "1px solid var(--separator)",
              background: "var(--material-regular)",
              overflow: "hidden",
            }}
          >
            {sessions.map((session, idx) => (
              <div
                key={session.id}
                style={{
                  padding: "var(--space-3) var(--space-5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: idx > 0 ? "1px solid var(--separator)" : undefined,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "var(--text-body)",
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    {session.id.slice(0, 8)}
                  </p>
                  <p
                    style={{
                      fontSize: "var(--text-caption2)",
                      color: "var(--text-tertiary)",
                      marginTop: 2,
                    }}
                  >
                    {session.source || "unknown"}{" "}
                    {session.createdAt
                      ? new Date(session.createdAt).toLocaleDateString()
                      : ""}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "var(--text-caption2)",
                    fontWeight: "var(--weight-semibold)",
                    padding: "2px 8px",
                    borderRadius: 10,
                    ...(session.status === "running"
                      ? {
                          background:
                            "color-mix(in srgb, var(--system-green) 15%, transparent)",
                          color: "var(--system-green)",
                        }
                      : session.status === "error"
                        ? {
                            background:
                              "color-mix(in srgb, var(--system-red) 15%, transparent)",
                            color: "var(--system-red)",
                          }
                        : {
                            background: "var(--fill-tertiary)",
                            color: "var(--text-tertiary)",
                          }),
                  }}
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
