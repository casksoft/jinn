"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { OrgTree } from "@/components/org/org-tree";
import { EmployeeDetail } from "@/components/org/employee-detail";
import { BoardView } from "@/components/org/board-view";

interface Employee {
  name: string;
  displayName?: string;
  rank?: string;
  engine?: string;
  department?: string;
}

interface OrgData {
  departments: string[];
  employees: Employee[];
}

export default function OrgPage() {
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"employee" | "board">("employee");

  useEffect(() => {
    api
      .getOrg()
      .then(async (data) => {
        const raw = data as { departments: string[]; employees: string[] };
        // Fetch details for each employee
        const employeeDetails = await Promise.all(
          raw.employees.map(async (name) => {
            try {
              const detail = await api.getEmployee(name);
              return detail as unknown as Employee;
            } catch {
              return { name } as Employee;
            }
          }),
        );
        setOrgData({
          departments: raw.departments,
          employees: employeeDetails,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleSelectEmployee(name: string) {
    setSelectedEmployee(name);
    setSelectedDepartment(null);
    setViewMode("employee");
  }

  function handleSelectDepartment(name: string) {
    setSelectedDepartment(name);
    setSelectedEmployee(null);
    setViewMode("board");
  }

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Organization</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Team structure and departments
          </p>
        </div>
        <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Organization</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Team structure and departments
          </p>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Failed to load organization: {error}
        </div>
      </div>
    );
  }

  const isEmpty =
    !orgData ||
    (orgData.employees.length === 0 && orgData.departments.length === 0);

  if (isEmpty) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Organization</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Team structure and departments
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-4xl mb-4 text-neutral-300">@</div>
          <p className="text-neutral-500 text-sm text-center max-w-sm">
            No organization set up yet. Chat with Jimmy to hire your first
            employee.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Organization</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Team structure and departments
        </p>
      </div>

      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Left: Org tree */}
        <div
          className="w-[300px] flex-shrink-0 rounded-xl border border-neutral-200 bg-white p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400 mb-3">
            Team
          </h3>
          <OrgTree
            data={orgData!}
            selectedEmployee={selectedEmployee}
            selectedDepartment={selectedDepartment}
            onSelectEmployee={handleSelectEmployee}
            onSelectDepartment={handleSelectDepartment}
          />
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 min-w-0">
          {/* View toggle when a department is selected */}
          {selectedDepartment && (
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setViewMode("board")}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === "board"
                    ? "bg-blue-50 text-blue-600"
                    : "text-neutral-500 hover:bg-neutral-100"
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode("employee")}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === "employee"
                    ? "bg-blue-50 text-blue-600"
                    : "text-neutral-500 hover:bg-neutral-100"
                }`}
              >
                Employee
              </button>
            </div>
          )}

          {viewMode === "employee" && selectedEmployee && (
            <EmployeeDetail name={selectedEmployee} />
          )}

          {viewMode === "board" && selectedDepartment && (
            <BoardView department={selectedDepartment} />
          )}

          {!selectedEmployee && !selectedDepartment && (
            <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
              Select an employee or department from the tree.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
