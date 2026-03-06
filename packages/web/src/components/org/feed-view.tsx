"use client"

import type { Employee } from "@/lib/api"

interface FeedViewProps {
  employees: Employee[]
  selectedName: string | null
  onSelect: (employee: Employee) => void
}

const RANK_EMOJI: Record<string, string> = {
  executive: "\uD83C\uDFAF",
  manager: "\uD83D\uDCCB",
  senior: "\u2B50",
  employee: "\uD83D\uDC64",
}

function RankBadge({ rank }: { rank: string }) {
  const colors: Record<
    string,
    { bg: string; text: string }
  > = {
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
  }
  const c = colors[rank] || colors.employee

  return (
    <span
      style={{
        fontSize: "var(--text-caption2)",
        fontWeight: "var(--weight-semibold)",
        color: c.text,
        background: c.bg,
        padding: "2px 8px",
        borderRadius: 10,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
      }}
    >
      {rank}
    </span>
  )
}

export function FeedView({ employees, selectedName, onSelect }: FeedViewProps) {
  // Sort: executives first, then managers, seniors, employees
  const rankOrder: Record<string, number> = {
    executive: 0,
    manager: 1,
    senior: 2,
    employee: 3,
  }
  const sorted = [...employees].sort(
    (a, b) => (rankOrder[a.rank] ?? 3) - (rankOrder[b.rank] ?? 3),
  )

  return (
    <div
      style={{
        overflowY: "auto",
        padding: "var(--space-6)",
        height: "100%",
      }}
    >
      {/* Summary row */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          marginBottom: "var(--space-5)",
        }}
      >
        {(["executive", "manager", "senior", "employee"] as const).map(
          (rank) => {
            const count = employees.filter((e) => e.rank === rank).length
            return (
              <div
                key={rank}
                style={{
                  flex: 1,
                  background: "var(--material-regular)",
                  border: "1px solid var(--separator)",
                  borderRadius: "var(--radius-md, 12px)",
                  padding: "var(--space-3) var(--space-4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                }}
              >
                <span style={{ fontSize: 20 }}>{RANK_EMOJI[rank]}</span>
                <div>
                  <div
                    style={{
                      fontSize: "var(--text-title3)",
                      fontWeight: "var(--weight-bold)",
                      color: "var(--text-primary)",
                      lineHeight: 1,
                    }}
                  >
                    {count}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-caption2)",
                      color: "var(--text-tertiary)",
                      marginTop: 2,
                      textTransform: "capitalize",
                    }}
                  >
                    {rank}s
                  </div>
                </div>
              </div>
            )
          },
        )}
      </div>

      {/* Employee list */}
      {sorted.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-16) var(--space-4)",
            color: "var(--text-tertiary)",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-body)",
              fontWeight: "var(--weight-medium)",
            }}
          >
            No employees found
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--separator)",
            overflow: "hidden",
          }}
        >
          {sorted.map((emp, idx) => {
            const isSelected = selectedName === emp.name
            const emoji = RANK_EMOJI[emp.rank] || RANK_EMOJI.employee

            return (
              <button
                key={emp.name}
                onClick={() => onSelect(emp)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-3) var(--space-4)",
                  width: "100%",
                  background: isSelected
                    ? "var(--fill-secondary)"
                    : "transparent",
                  border: "none",
                  borderTop:
                    idx > 0 ? "1px solid var(--separator)" : undefined,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 150ms ease",
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
                  {emoji}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--text-body)",
                        fontWeight: "var(--weight-semibold)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {emp.displayName || emp.name}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-caption1)",
                        color: "var(--text-quaternary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {emp.name}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      marginTop: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--text-caption1)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {emp.department || "No department"}
                    </span>
                  </div>
                </div>

                <RankBadge rank={emp.rank} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
