"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  api,
  type ExternalProject,
  type ExternalSession,
  type ExternalSessionSummary,
} from "@/lib/api"
import { PageLayout } from "@/components/page-layout"
import { useBreadcrumbs } from "@/context/breadcrumb-context"
import { Card, CardContent } from "@/components/ui/card"
import { Folder } from "lucide-react"

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const TYPE_COLOR: Record<string, string> = {
  user: "var(--accent)",
  assistant: "var(--system-green)",
  attachment: "var(--text-quaternary)",
}

function ProjectsList() {
  useBreadcrumbs([{ label: "Claude CLI" }])
  const [projects, setProjects] = useState<ExternalProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getExternalProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="h-full overflow-y-auto p-[var(--space-6)]">
      <div className="mb-[var(--space-6)]">
        <h2 className="text-[length:var(--text-title2)] font-[var(--weight-bold)] text-[var(--text-primary)] mb-[var(--space-1)]">
          Claude CLI Sessions
        </h2>
        <p className="text-[length:var(--text-body)] text-[var(--text-tertiary)]">
          Read-only history from ~/.claude/projects/
        </p>
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <Loading />
      ) : projects.length === 0 ? (
        <Card><CardContent><div className="text-center p-[var(--space-6)]">
          <p className="text-[length:var(--text-body)] text-[var(--text-tertiary)]">No Claude CLI projects found</p>
        </div></CardContent></Card>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[var(--space-4)]">
          {projects.map((p) => (
            <Link key={p.slug} href={`/external?slug=${encodeURIComponent(p.slug)}`}>
              <Card className="py-4 cursor-pointer transition-colors hover:border-[var(--accent)]">
                <CardContent className="flex flex-col gap-3">
                  <div
                    className="w-10 h-10 rounded-[var(--radius-md,12px)] flex items-center justify-center text-[var(--accent)]"
                    style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
                  >
                    <Folder size={20} />
                  </div>
                  <div>
                    <p className="text-[length:var(--text-body)] font-[var(--weight-semibold)] text-[var(--text-primary)] mb-0.5 break-all">
                      {p.cwd}
                    </p>
                    <p className="text-[length:var(--text-caption1)] text-[var(--text-tertiary)]">
                      {p.sessionCount} session{p.sessionCount === 1 ? "" : "s"} · last {fmtDate(p.lastActivity)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function SessionsList({ slug }: { slug: string }) {
  useBreadcrumbs([{ label: "Claude CLI", href: "/external" }, { label: slug }])
  const [sessions, setSessions] = useState<ExternalSessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getExternalSessions(slug)
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div className="h-full overflow-y-auto p-[var(--space-6)]">
      <div className="mb-[var(--space-6)]">
        <Link href="/external" className="text-[length:var(--text-caption1)] text-[var(--accent)] mb-2 inline-block">
          ← All projects
        </Link>
        <h2 className="text-[length:var(--text-title2)] font-[var(--weight-bold)] text-[var(--text-primary)] mb-[var(--space-1)] break-all">
          {slug}
        </h2>
        <p className="text-[length:var(--text-body)] text-[var(--text-tertiary)]">
          {sessions.length} session{sessions.length === 1 ? "" : "s"}
        </p>
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? <Loading /> : (
        <div className="flex flex-col gap-[var(--space-3)]">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/external?slug=${encodeURIComponent(slug)}&session=${encodeURIComponent(s.id)}`}
            >
              <Card className="py-3 cursor-pointer transition-colors hover:border-[var(--accent)]">
                <CardContent className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[length:var(--text-body)] font-[var(--weight-medium)] text-[var(--text-primary)] line-clamp-2 break-words">
                      {s.title}
                    </p>
                    <p className="text-[length:var(--text-caption1)] text-[var(--text-tertiary)] mt-1">
                      {fmtDate(s.lastMessageAt)} · {s.messageCount} msgs · {fmtSize(s.sizeBytes)}
                    </p>
                  </div>
                  <code className="text-[length:var(--text-caption2)] text-[var(--text-quaternary)] shrink-0">
                    {s.id.slice(0, 8)}
                  </code>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function SessionDetail({ slug, sessionId }: { slug: string; sessionId: string }) {
  useBreadcrumbs([
    { label: "Claude CLI", href: "/external" },
    { label: slug, href: `/external?slug=${encodeURIComponent(slug)}` },
    { label: sessionId.slice(0, 8) },
  ])
  const [session, setSession] = useState<ExternalSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getExternalSession(slug, sessionId)
      .then(setSession)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug, sessionId])

  return (
    <div className="h-full overflow-y-auto p-[var(--space-6)]">
      <Link href={`/external?slug=${encodeURIComponent(slug)}`} className="text-[length:var(--text-caption1)] text-[var(--accent)] mb-4 inline-block">
        ← Back to sessions
      </Link>

      {error && <ErrorBox message={error} />}
      {loading ? <Loading /> : session ? (
        <>
          <div className="mb-[var(--space-6)]">
            <h2 className="text-[length:var(--text-title3)] font-[var(--weight-bold)] text-[var(--text-primary)] mb-[var(--space-1)]">
              {session.title}
            </h2>
            <p className="text-[length:var(--text-caption1)] text-[var(--text-tertiary)]">
              {session.messageCount} messages · {fmtDate(session.firstMessageAt)} → {fmtDate(session.lastMessageAt)}
            </p>
            <code className="text-[length:var(--text-caption2)] text-[var(--text-quaternary)]">{session.id}</code>
          </div>

          <div className="flex flex-col gap-[var(--space-4)] max-w-4xl">
            {session.messages.map((m, i) => (
              <div
                key={m.uuid || i}
                className="rounded-[var(--radius-md,12px)] p-[var(--space-4)] border border-border"
                style={{
                  background: m.type === "user"
                    ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                    : "var(--bg-secondary)",
                }}
              >
                <div className="flex items-center gap-2 mb-[var(--space-2)]">
                  <span
                    className="text-[length:var(--text-caption1)] font-[var(--weight-semibold)] uppercase tracking-wide"
                    style={{ color: TYPE_COLOR[m.type] || "var(--text-tertiary)" }}
                  >
                    {m.type}{m.isSidechain ? " · sidechain" : ""}
                  </span>
                  <span className="text-[length:var(--text-caption2)] text-[var(--text-quaternary)]">
                    {fmtDate(m.timestamp)}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap break-words text-[length:var(--text-body)] text-[var(--text-primary)] font-sans">
                  {m.content || "(empty)"}
                </pre>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="mb-[var(--space-4)] rounded-[var(--radius-md,12px)] py-[var(--space-3)] px-[var(--space-4)] text-[length:var(--text-body)] text-[var(--system-red)]"
      style={{
        background: "color-mix(in srgb, var(--system-red) 10%, transparent)",
        border: "1px solid color-mix(in srgb, var(--system-red) 30%, transparent)",
      }}
    >
      {message}
    </div>
  )
}

function Loading() {
  return <div className="text-center p-[var(--space-8)] text-[var(--text-tertiary)]">Loading...</div>
}

function ExternalRouter() {
  const search = useSearchParams()
  const slug = search.get("slug")
  const sessionId = search.get("session")

  if (slug && sessionId) return <SessionDetail slug={slug} sessionId={sessionId} />
  if (slug) return <SessionsList slug={slug} />
  return <ProjectsList />
}

export default function ExternalPage() {
  return (
    <PageLayout>
      <Suspense fallback={<Loading />}>
        <ExternalRouter />
      </Suspense>
    </PageLayout>
  )
}
