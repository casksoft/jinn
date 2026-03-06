"use client"

import type { Employee } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"

interface GridViewProps {
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

function EmployeeCard({
  employee,
  selected,
  onSelect,
}: {
  employee: Employee
  selected: boolean
  onSelect: () => void
}) {
  const emoji = RANK_EMOJI[employee.rank] || RANK_EMOJI.employee

  return (
    <button
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-md, 12px)",
        background: "var(--material-regular)",
        border: selected
          ? "1.5px solid var(--accent)"
          : "1px solid var(--separator)",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        transition: "all 150ms ease",
        boxShadow: selected
          ? "0 0 0 1px var(--accent), var(--shadow-subtle)"
          : "var(--shadow-subtle)",
      }}
    >
      <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>
        {emoji}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-body)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "var(--leading-tight)",
          }}
        >
          {employee.displayName || employee.name}
        </div>
        <div
          style={{
            fontSize: "var(--text-caption1)",
            color: "var(--text-tertiary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginTop: 1,
          }}
        >
          {employee.department}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "var(--text-caption2)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--accent)",
            background: "var(--accent-fill)",
            padding: "1px 7px",
            borderRadius: 10,
          }}
        >
          {employee.engine}
        </span>
        <span
          style={{
            fontSize: "var(--text-caption2)",
            fontWeight: "var(--weight-medium)",
            color: "var(--text-quaternary)",
            background: "var(--fill-quaternary)",
            padding: "1px 7px",
            borderRadius: 10,
          }}
        >
          {employee.model}
        </span>
      </div>
    </button>
  )
}

function DepartmentSection({
  label,
  count,
  children,
}: {
  label: string
  count: number
  children: React.ReactNode
}) {
  return (
    <Card
      className="p-0 shadow-none"
      style={{
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--separator)",
      }}
    >
      <CardContent
        className="p-4"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-1)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-caption1)",
              fontWeight: "var(--weight-semibold)",
              letterSpacing: "var(--tracking-wide)",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: "var(--text-caption2)",
              color: "var(--text-quaternary)",
              marginLeft: "auto",
            }}
          >
            {count} employee{count !== 1 ? "s" : ""}
          </span>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

export function GridView({ employees, selectedName, onSelect }: GridViewProps) {
  // Group by department
  const deptMap = new Map<string, Employee[]>()
  const ungrouped: Employee[] = []

  for (const emp of employees) {
    if (emp.department) {
      const list = deptMap.get(emp.department) || []
      list.push(emp)
      deptMap.set(emp.department, list)
    } else {
      ungrouped.push(emp)
    }
  }

  // Find executive
  const executive = employees.find((e) => e.rank === "executive")

  return (
    <div
      style={{
        overflowY: "auto",
        padding: "var(--space-6)",
        height: "100%",
      }}
    >
      {/* Executive banner */}
      {executive && (
        <button
          onClick={() => onSelect(executive)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-5)",
            width: "100%",
            padding: "var(--space-5) var(--space-6)",
            borderRadius: "var(--radius-xl, 20px)",
            background: "var(--material-regular)",
            border:
              selectedName === executive.name
                ? "1.5px solid var(--accent)"
                : "1px solid var(--separator)",
            cursor: "pointer",
            textAlign: "left",
            marginBottom: "var(--space-6)",
            transition: "all 150ms ease",
            boxShadow:
              selectedName === executive.name
                ? "0 0 0 1px var(--accent), var(--shadow-card)"
                : "var(--shadow-card)",
          }}
        >
          <span style={{ fontSize: 40, lineHeight: 1 }}>
            {RANK_EMOJI.executive}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--text-title2)",
                fontWeight: "var(--weight-bold)",
                color: "var(--text-primary)",
                letterSpacing: "var(--tracking-tight)",
                lineHeight: "var(--leading-tight)",
              }}
            >
              {executive.displayName || executive.name}
            </div>
            <div
              style={{
                fontSize: "var(--text-subheadline)",
                color: "var(--text-secondary)",
                marginTop: 2,
              }}
            >
              {executive.department}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-4)",
              flexShrink: 0,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "var(--text-title3)",
                  fontWeight: "var(--weight-bold)",
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                {employees.length}
              </div>
              <div
                style={{
                  fontSize: "var(--text-caption2)",
                  color: "var(--text-tertiary)",
                  marginTop: 2,
                }}
              >
                employees
              </div>
            </div>
            <div
              style={{
                width: 1,
                alignSelf: "stretch",
                background: "var(--separator)",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "var(--text-title3)",
                  fontWeight: "var(--weight-bold)",
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                {deptMap.size}
              </div>
              <div
                style={{
                  fontSize: "var(--text-caption2)",
                  color: "var(--text-tertiary)",
                  marginTop: 2,
                }}
              >
                depts
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Department columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "var(--space-5)",
          alignItems: "start",
        }}
      >
        {Array.from(deptMap.entries()).map(([dept, members]) => {
          const filtered = members.filter((m) => m.name !== executive?.name)
          if (filtered.length === 0) return null
          return (
            <DepartmentSection
              key={dept}
              label={dept}
              count={filtered.length}
            >
              {filtered.map((emp) => (
                <EmployeeCard
                  key={emp.name}
                  employee={emp}
                  selected={selectedName === emp.name}
                  onSelect={() => onSelect(emp)}
                />
              ))}
            </DepartmentSection>
          )
        })}

        {ungrouped.length > 0 && (
          <DepartmentSection
            label="Unassigned"
            count={ungrouped.filter((u) => u.name !== executive?.name).length}
          >
            {ungrouped
              .filter((u) => u.name !== executive?.name)
              .map((emp) => (
                <EmployeeCard
                  key={emp.name}
                  employee={emp}
                  selected={selectedName === emp.name}
                  onSelect={() => onSelect(emp)}
                />
              ))}
          </DepartmentSection>
        )}
      </div>
    </div>
  )
}
