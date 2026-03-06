"use client"
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ConnectionLineType,
} from "@xyflow/react"
import { useCallback, useEffect } from "react"
import dagre from "@dagrejs/dagre"
import type { Employee } from "@/lib/api"
import { nodeTypes } from "@/components/org/employee-node"

interface OrgMapProps {
  employees: Employee[]
  selectedName: string | null
  onNodeClick: (employee: Employee) => void
}

const NODE_W = 240
const NODE_H = 90
const COL_GAP = 80
const GROUP_PAD_X = 30
const GROUP_PAD_TOP = 36
const GROUP_PAD_BOTTOM = 24

// ── Dagre helper ───────────────────────────────────────────────

function dagreLayout(
  nodeIds: string[],
  edges: [string, string][],
  opts: { rankdir?: string; nodesep?: number; ranksep?: number } = {},
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: opts.rankdir ?? "TB",
    nodesep: opts.nodesep ?? 60,
    ranksep: opts.ranksep ?? 120,
    marginx: 20,
    marginy: 20,
  })

  for (const id of nodeIds) {
    g.setNode(id, { width: NODE_W, height: NODE_H })
  }
  for (const [src, tgt] of edges) {
    g.setEdge(src, tgt)
  }

  dagre.layout(g)

  const positions = new Map<string, { x: number; y: number }>()
  for (const id of nodeIds) {
    const n = g.node(id)
    positions.set(id, { x: n.x - NODE_W / 2, y: n.y - NODE_H / 2 })
  }
  return positions
}

// ── Build layout grouped by department ─────────────────────────

function buildDepartmentLayout(
  employees: Employee[],
  selectedName: string | null,
): { nodes: Node[]; edges: Edge[] } {
  if (employees.length === 0) return { nodes: [], edges: [] }

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

  // Find executive (root node)
  const executive = employees.find((e) => e.rank === "executive")

  const nodes: Node[] = []
  let cursorX = 0
  const COLUMNS_TOP = executive ? 160 : 0

  type ColumnResult = { groupNode: Node; childNodes: Node[]; width: number }
  const columnResults: ColumnResult[] = []

  let ci = 0
  for (const [dept, members] of deptMap) {
    // Filter out executive from department groups
    const deptMembers = members.filter((m) => m.name !== executive?.name)
    if (deptMembers.length === 0) {
      ci++
      continue
    }

    const memberIds = deptMembers.map((m) => m.name)
    const positions = dagreLayout(memberIds, [], { nodesep: 40, ranksep: 90 })

    // Compute bounding box
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity
    for (const pos of positions.values()) {
      minX = Math.min(minX, pos.x)
      maxX = Math.max(maxX, pos.x + NODE_W)
      minY = Math.min(minY, pos.y)
      maxY = Math.max(maxY, pos.y + NODE_H)
    }
    const contentW = maxX - minX
    const contentH = maxY - minY
    const groupW = contentW + GROUP_PAD_X * 2
    const groupH = GROUP_PAD_TOP + contentH + GROUP_PAD_BOTTOM

    const groupId = `group-${ci}`
    const groupNode: Node = {
      id: groupId,
      type: "departmentGroup",
      data: { label: dept },
      position: { x: cursorX, y: COLUMNS_TOP },
      style: {
        width: groupW,
        height: groupH,
        background: "var(--fill-quaternary)",
        borderRadius: 12,
        border: "1px solid var(--separator)",
        padding: 0,
      },
      selectable: false,
      draggable: false,
    }

    const childNodes: Node[] = []
    for (const emp of deptMembers) {
      const pos = positions.get(emp.name)
      if (!pos) continue
      childNodes.push({
        id: emp.name,
        type: "employeeNode",
        data: emp as unknown as Record<string, unknown>,
        position: {
          x: pos.x - minX + GROUP_PAD_X,
          y: pos.y - minY + GROUP_PAD_TOP,
        },
        parentId: groupId,
        extent: "parent" as const,
        selected: emp.name === selectedName,
      })
    }

    columnResults.push({ groupNode, childNodes, width: groupW })
    cursorX += groupW + COL_GAP
    ci++
  }

  // Ungrouped column
  if (ungrouped.length > 0) {
    const ungroupedFiltered = ungrouped.filter(
      (u) => u.name !== executive?.name,
    )
    if (ungroupedFiltered.length > 0) {
      const memberIds = ungroupedFiltered.map((m) => m.name)
      const positions = dagreLayout(memberIds, [], { nodesep: 40, ranksep: 90 })

      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity
      for (const pos of positions.values()) {
        minX = Math.min(minX, pos.x)
        maxX = Math.max(maxX, pos.x + NODE_W)
        minY = Math.min(minY, pos.y)
        maxY = Math.max(maxY, pos.y + NODE_H)
      }
      const contentW = maxX - minX
      const contentH = maxY - minY
      const groupW = contentW + GROUP_PAD_X * 2
      const groupH = GROUP_PAD_TOP + contentH + GROUP_PAD_BOTTOM

      const groupId = `group-ungrouped`
      const groupNode: Node = {
        id: groupId,
        type: "departmentGroup",
        data: { label: "Unassigned" },
        position: { x: cursorX, y: COLUMNS_TOP },
        style: {
          width: groupW,
          height: groupH,
          background: "var(--fill-quaternary)",
          borderRadius: 12,
          border: "1px solid var(--separator)",
          padding: 0,
        },
        selectable: false,
        draggable: false,
      }

      const childNodes: Node[] = []
      for (const emp of ungroupedFiltered) {
        const pos = positions.get(emp.name)
        if (!pos) continue
        childNodes.push({
          id: emp.name,
          type: "employeeNode",
          data: emp as unknown as Record<string, unknown>,
          position: {
            x: pos.x - minX + GROUP_PAD_X,
            y: pos.y - minY + GROUP_PAD_TOP,
          },
          parentId: groupId,
          extent: "parent" as const,
          selected: emp.name === selectedName,
        })
      }

      columnResults.push({ groupNode, childNodes, width: groupW })
      cursorX += groupW + COL_GAP
    }
  }

  const totalWidth = cursorX - COL_GAP

  // Place executive at the top, centered
  if (executive) {
    nodes.push({
      id: executive.name,
      type: "employeeNode",
      data: executive as unknown as Record<string, unknown>,
      position: { x: Math.max(0, totalWidth / 2 - NODE_W / 2), y: 0 },
      selected: executive.name === selectedName,
    })
  }

  for (const cr of columnResults) {
    nodes.push(cr.groupNode)
    nodes.push(...cr.childNodes)
  }

  // Build edges from executive to department managers
  const edges: Edge[] = []
  if (executive) {
    // Connect executive to the first manager/senior in each department
    for (const [, members] of deptMap) {
      const managers = members
        .filter((m) => m.name !== executive.name)
        .sort((a, b) => {
          const rankOrder = { executive: 0, manager: 1, senior: 2, employee: 3 }
          return (
            (rankOrder[a.rank] ?? 3) - (rankOrder[b.rank] ?? 3)
          )
        })
      if (managers.length > 0) {
        const target = managers[0]
        const isHighlighted =
          selectedName === executive.name || selectedName === target.name
        edges.push({
          id: `${executive.name}-${target.name}`,
          source: executive.name,
          target: target.name,
          type: "smoothstep",
          style: {
            stroke: isHighlighted
              ? "var(--accent)"
              : "var(--text-quaternary)",
            strokeWidth: isHighlighted ? 2.5 : 1.5,
            opacity: isHighlighted ? 1 : 0.7,
          },
          animated: isHighlighted,
        })
      }
    }
  }

  return { nodes, edges }
}

// ── Component ──────────────────────────────────────────────────

export function OrgMap({ employees, selectedName, onNodeClick }: OrgMapProps) {
  const { nodes: initialNodes, edges: initialEdges } = buildDepartmentLayout(
    employees,
    selectedName,
  )
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    const { nodes: n, edges: e } = buildDepartmentLayout(
      employees,
      selectedName,
    )
    setNodes(n)
    setEdges(e)
  }, [employees, selectedName, setNodes, setEdges])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const employee = employees.find((e) => e.name === node.id)
      if (employee) onNodeClick(employee)
    },
    [employees, onNodeClick],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      connectionLineType={ConnectionLineType.SmoothStep}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Controls
        position="bottom-left"
        style={{ left: 16, bottom: 16 }}
      />
    </ReactFlow>
  )
}
