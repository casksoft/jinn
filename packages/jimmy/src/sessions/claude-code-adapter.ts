// Read-only adapter over ~/.claude/projects/ — exposes Claude Code CLI
// session transcripts (JSONL files) so Jinn can surface them in its UI.
//
// Layout on disk:
//   ~/.claude/projects/<slug>/<session-id>.jsonl
// where <slug> is Claude Code's serialization of the project cwd
// (all `/` replaced with `-`; consecutive `-` usually imply a `.`-prefixed
// path segment). Each .jsonl line is one event; we care about:
//   - type="user"      → user prompt (message.content is string or blocks)
//   - type="assistant" → assistant reply (same shape)
//   - type="attachment" → attached file reference
// Other types (queue-operation, last-prompt, summary) are metadata we ignore
// for message-count/transcript purposes.

import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

const CLAUDE_PROJECTS_DIR = join(homedir(), ".claude", "projects");

export interface ExternalProject {
  slug: string;
  cwd: string;
  sessionCount: number;
  lastActivity: string | null;
}

export interface ExternalSessionSummary {
  id: string;
  projectSlug: string;
  title: string;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  sizeBytes: number;
}

export interface ExternalMessage {
  uuid: string;
  parentUuid: string | null;
  type: "user" | "assistant" | "attachment";
  timestamp: string;
  content: string;
  isSidechain?: boolean;
}

export interface ExternalSession extends ExternalSessionSummary {
  messages: ExternalMessage[];
}

// Claude Code slugifies cwd by replacing "/" with "-". A leading "."
// in a segment ends up as "--" (because "/." → "-."  becomes "--").
// Inverse: `-` → `/`, then `//` → `/.`. Not bijective for exotic paths,
// but good enough for display.
function unslugifyCwd(slug: string): string {
  const withSlashes = slug.replace(/-/g, "/");
  return withSlashes.replace(/\/\//g, "/.");
}

function extractTextContent(message: unknown): string {
  if (!message) return "";
  if (typeof message === "string") return message;
  if (typeof message !== "object") return "";
  const m = message as Record<string, unknown>;
  if (typeof m.content === "string") return m.content;
  if (Array.isArray(m.content)) {
    return m.content
      .filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
      .map((b) => {
        if (b.type === "text" && typeof b.text === "string") return b.text;
        if (b.type === "tool_use") return `[tool_use: ${String(b.name || "?")}]`;
        if (b.type === "tool_result") {
          const c = b.content;
          if (typeof c === "string") return `[tool_result] ${c.slice(0, 400)}`;
          return "[tool_result]";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function sanitizeSlug(slug: string): boolean {
  // Only allow filename-safe characters; reject traversal.
  return /^[A-Za-z0-9._-]+$/.test(slug) && !slug.includes("..");
}

function sanitizeSessionId(id: string): boolean {
  return /^[A-Za-z0-9-]+$/.test(id) && !id.includes("..");
}

export async function listProjects(): Promise<ExternalProject[]> {
  let entries: string[];
  try {
    entries = await readdir(CLAUDE_PROJECTS_DIR);
  } catch {
    return [];
  }

  const projects: ExternalProject[] = [];
  for (const slug of entries) {
    if (slug.startsWith(".") || !sanitizeSlug(slug)) continue;
    const dir = join(CLAUDE_PROJECTS_DIR, slug);
    let dirStat;
    try {
      dirStat = await stat(dir);
    } catch {
      continue;
    }
    if (!dirStat.isDirectory()) continue;

    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }
    const sessionFiles = files.filter((f) => f.endsWith(".jsonl"));
    if (sessionFiles.length === 0) continue;

    let lastActivity: string | null = null;
    for (const f of sessionFiles) {
      try {
        const s = await stat(join(dir, f));
        const iso = s.mtime.toISOString();
        if (!lastActivity || iso > lastActivity) lastActivity = iso;
      } catch {
        // ignore individual file failures
      }
    }

    projects.push({
      slug,
      cwd: unslugifyCwd(slug),
      sessionCount: sessionFiles.length,
      lastActivity,
    });
  }

  projects.sort((a, b) => (b.lastActivity || "").localeCompare(a.lastActivity || ""));
  return projects;
}

async function readSessionSummary(
  projectSlug: string,
  id: string,
): Promise<ExternalSessionSummary | null> {
  const filePath = join(CLAUDE_PROJECTS_DIR, projectSlug, `${id}.jsonl`);
  let stats;
  try {
    stats = await stat(filePath);
  } catch {
    return null;
  }

  let firstMessageAt: string | null = null;
  let lastMessageAt: string | null = null;
  let messageCount = 0;
  let title = "";

  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let d: Record<string, unknown>;
    try {
      d = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }
    const t = d.type;
    if (t !== "user" && t !== "assistant") continue;
    const ts = typeof d.timestamp === "string" ? d.timestamp : null;
    if (ts) {
      if (!firstMessageAt) firstMessageAt = ts;
      lastMessageAt = ts;
    }
    messageCount++;
    if (!title && t === "user") {
      const content = extractTextContent(d.message);
      if (content.trim()) title = content.trim().slice(0, 140);
    }
  }

  return {
    id,
    projectSlug,
    title: title || "(empty)",
    firstMessageAt,
    lastMessageAt,
    messageCount,
    sizeBytes: stats.size,
  };
}

export async function listSessions(projectSlug: string): Promise<ExternalSessionSummary[]> {
  if (!sanitizeSlug(projectSlug)) return [];
  const dir = join(CLAUDE_PROJECTS_DIR, projectSlug);
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }

  const summaries: ExternalSessionSummary[] = [];
  for (const f of files) {
    if (!f.endsWith(".jsonl")) continue;
    const id = f.slice(0, -".jsonl".length);
    if (!sanitizeSessionId(id)) continue;
    const summary = await readSessionSummary(projectSlug, id);
    if (summary) summaries.push(summary);
  }

  summaries.sort((a, b) => (b.lastMessageAt || "").localeCompare(a.lastMessageAt || ""));
  return summaries;
}

export async function getSession(
  projectSlug: string,
  id: string,
): Promise<ExternalSession | null> {
  if (!sanitizeSlug(projectSlug) || !sanitizeSessionId(id)) return null;
  const summary = await readSessionSummary(projectSlug, id);
  if (!summary) return null;

  const filePath = join(CLAUDE_PROJECTS_DIR, projectSlug, `${id}.jsonl`);
  const messages: ExternalMessage[] = [];

  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let d: Record<string, unknown>;
    try {
      d = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }
    const t = d.type;
    if (t !== "user" && t !== "assistant" && t !== "attachment") continue;
    let content = extractTextContent(d.message);
    if (!content && t === "attachment") {
      content = `[attachment] ${JSON.stringify(d.attachment || {}).slice(0, 400)}`;
    }
    messages.push({
      uuid: typeof d.uuid === "string" ? d.uuid : "",
      parentUuid: typeof d.parentUuid === "string" ? d.parentUuid : null,
      type: t as "user" | "assistant" | "attachment",
      timestamp: typeof d.timestamp === "string" ? d.timestamp : "",
      content,
      isSidechain: typeof d.isSidechain === "boolean" ? d.isSidechain : undefined,
    });
  }

  return { ...summary, messages };
}
