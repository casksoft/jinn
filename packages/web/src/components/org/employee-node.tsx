"use client"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { Employee } from "@/lib/api"

const RANK_EMOJI: Record<string, string> = {
  executive: "\uD83C\uDFAF",
  manager: "\uD83D\uDCCB",
  senior: "\u2B50",
  employee: "\uD83D\uDC64",
}

type EmployeeNodeData = Employee & Record<string, unknown>

export function EmployeeNode({ data, selected }: NodeProps) {
  const employee = data as EmployeeNodeData
  const emoji = RANK_EMOJI[employee.rank] || RANK_EMOJI.employee

  return (
    <div
      style={{
        background: "var(--material-regular)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRadius: "var(--radius-md, 12px)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--separator)"}`,
        padding: "var(--space-3) var(--space-4)",
        width: 240,
        cursor: "pointer",
        position: "relative",
        boxShadow: selected
          ? "0 0 0 1px var(--accent), var(--shadow-card)"
          : "var(--shadow-card)",
        transition: "box-shadow 150ms ease",
      }}
    >
      {/* Emoji + Name row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          marginBottom: "var(--space-1)",
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
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
              fontSize: "var(--text-caption2)",
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
      </div>

      {/* Engine badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          marginTop: "var(--space-2)",
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
      </div>

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

export function DepartmentGroupNode({ data }: NodeProps) {
  const { label } = data as { label: string } & Record<string, unknown>
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "var(--text-caption2)",
          fontWeight: "var(--weight-semibold)",
          letterSpacing: "var(--tracking-wide)",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {label}
      </div>
    </div>
  )
}

export const nodeTypes = {
  employeeNode: EmployeeNode,
  departmentGroup: DepartmentGroupNode,
}
