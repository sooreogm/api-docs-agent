"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type {
  AgentDocsResponse,
  DocsEndpoint,
  DocsTag,
  GenerateExampleResponse,
} from "@/types/api-docs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_DOCS = "/api/agent-docs";
const GENERATE_EXAMPLE = "/api-reference/generate-example";
const AGENT_CHAT = "/api/agent/chat";

export function DocsView() {
  const [docs, setDocs] = useState<AgentDocsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [openapiUrl, setOpenapiUrl] = useState<string | null>(null);

  const loadDocs = useCallback(async (urlParam: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const target = urlParam
        ? `${API_DOCS}?openapi_url=${encodeURIComponent(urlParam)}`
        : API_DOCS;
      const res = await fetch(target);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || res.statusText || "Failed to load docs");
      }
      const data: AgentDocsResponse = await res.json();
      setDocs(data);
      setOpenapiUrl(urlParam);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load docs");
      setDocs(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: if ?openapi_url= in URL, load external docs
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("openapi_url");
    if (urlParam) loadDocs(urlParam);
  }, [loadDocs]);

  const handleMyApi = () => loadDocs(null);
  const handleExternalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = externalUrl.trim();
    if (!url) return;
    loadDocs(url);
    const u = new URL(window.location.href);
    u.searchParams.set("openapi_url", url);
    window.history.replaceState({}, "", u.toString());
  };

  if (docs) {
    return (
      <DocsUI
        docs={docs}
        openapiUrl={openapiUrl}
        onReset={() => {
          setDocs(null);
          setOpenapiUrl(null);
          window.history.replaceState({}, "", window.location.pathname || "/");
        }}
      />
    );
  }

  const isDebug = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-8 safe-area-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(34,197,94,0.06),transparent)]"
        aria-hidden
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-sky-500/[0.03] rounded-full blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-lg space-y-10 min-w-0">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            API Docs
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-sm mx-auto">
            Paste any OpenAPI or Swagger URL to browse docs, chat, and generate
            code examples.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 rounded-full border-2 border-neutral-600 border-t-emerald-500 animate-spin" />
            <p className="text-neutral-500 text-sm">Loading docs…</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Document an API — primary card */}
            <div className="rounded-2xl bg-neutral-900/80 border border-neutral-700/80 shadow-xl shadow-black/20 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                  →
                </span>
                <h2 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                  Document an API
                </h2>
              </div>
              <p className="text-neutral-400 text-sm">
                Base URL or direct link to OpenAPI/Swagger JSON (e.g.
                …/openapi.json or …/swagger.json).
              </p>
              <form
                onSubmit={handleExternalSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://api.example.com or …/openapi.json"
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-neutral-950/80 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
                <button
                  type="submit"
                  className="sm:shrink-0 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                >
                  Load
                </button>
              </form>
            </div>

            {/* Load my API docs — only in debug */}
            {isDebug && (
              <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800 border-dashed p-6 space-y-3">
                <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-widest">
                  Document my API (dev)
                </h2>
                <p className="text-neutral-500 text-sm">
                  Use this app’s OpenAPI (same origin).
                </p>
                <button
                  type="button"
                  onClick={handleMyApi}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700 hover:text-neutral-100 border border-neutral-700 transition-colors"
                >
                  Load my API docs
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ChatMessage {
  role: string;
  content: string;
}

function DocsUI({
  docs,
  openapiUrl,
  onReset,
}: {
  docs: AgentDocsResponse;
  openapiUrl: string | null;
  onReset: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [contextTagNames, setContextTagNames] = useState<string[]>([]);
  const [atMentionHighlight, setAtMentionHighlight] = useState(0);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const el = chatInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [chatInput, resizeTextarea]);

  const closeSidebar = () => setSidebarOpen(false);

  const addContextTag = (tagName: string) => {
    if (!tagName || contextTagNames.includes(tagName)) return;
    setContextTagNames((prev) => [...prev, tagName].sort());
  };

  const removeContextTag = (tagName: string) => {
    setContextTagNames((prev) => prev.filter((t) => t !== tagName));
  };

  // When user types "@", show overlay with modules. Query = text after last "@".
  const atMatch = chatInput.match(/@([^\s]*)$/);
  const atMentionQuery = atMatch ? atMatch[1].toLowerCase() : null;
  const matchingTags =
    atMentionQuery === null
      ? []
      : docs.tags.filter((t) => t.name.toLowerCase().includes(atMentionQuery));
  const showAtOverlay = atMentionQuery !== null && docs.tags.length > 0;

  const applyAtMention = (tagName: string) => {
    addContextTag(tagName);
    setChatInput((prev) => prev.replace(/@[^\s]*$/, "").trimEnd());
    setAtMentionHighlight(0);
    chatInputRef.current?.focus();
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = chatInput.trim();
    if (!content || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const messages = [...chatMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const body: {
        messages: { role: string; content: string }[];
        openapi_url?: string;
        context_tag_names?: string[];
      } = { messages };
      if (openapiUrl) body.openapi_url = openapiUrl;
      if (contextTagNames.length > 0) body.context_tag_names = contextTagNames;
      const res = await fetch(AGENT_CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error((data as { detail?: string }).detail || res.statusText);
      const assistant = (
        data as { message?: { role: string; content: string } }
      ).message;
      if (assistant?.content != null)
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistant.content },
        ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Failed to send.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden relative safe-area-padding">
      {/* Same background as landing page */}
      <div className="fixed inset-0 -z-10 bg-[#0a0a0a]" aria-hidden />
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]"
        aria-hidden
      />
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(34,197,94,0.06),transparent)]"
        aria-hidden
      />
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] -z-10 bg-sky-500/[0.03] rounded-full blur-3xl"
        aria-hidden
      />

      <div className="fixed top-4 left-4 right-4 z-30 flex justify-center pointer-events-none">
        <header className="pointer-events-auto w-full max-w-4xl h-14 flex items-center gap-2 sm:gap-4 px-4 sm:px-5 rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-xl shadow-lg shadow-black/20">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <a
            href="#overview"
            className="font-semibold text-neutral-50 truncate min-w-0 flex-1 sm:flex-initial tracking-tight"
          >
            {docs.title}
          </a>
          <nav className="hidden sm:flex gap-1">
            <a
              href="#overview"
              className="text-sm text-neutral-400 hover:text-neutral-100 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              Overview
            </a>
            <a
              href="#overview-modules"
              className="text-sm text-neutral-400 hover:text-neutral-100 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              API Reference
            </a>
          </nav>
          <div className="flex-1 min-w-0" />
          {docs.base_url && (
            <a
              href={`${docs.base_url}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline text-sm text-neutral-400 hover:text-neutral-100 shrink-0 transition-colors"
            >
              Try in Swagger
            </a>
          )}
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-neutral-400 hover:text-neutral-100 shrink-0 transition-colors"
          >
            Change API
          </button>
        </header>
      </div>

      {/* Backdrop when sidebar is open on mobile */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={closeSidebar}
        className={`fixed inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed top-20 left-0 bottom-0 w-[min(280px,85vw)] overflow-y-auto z-20 lg:z-10 transition-transform duration-200 ease-out
          bg-surface border-r border-neutral-800
          lg:left-4 lg:top-24 lg:bottom-4 lg:w-[var(--side-width)] lg:rounded-2xl lg:border lg:border-white/10 lg:bg-neutral-900/40 lg:backdrop-blur-xl lg:shadow-lg lg:shadow-black/20
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <nav className="p-4 space-y-5">
          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest px-2">
            Getting started
          </p>
          <ul className="space-y-0.5">
            <li>
              <a
                href="#overview"
                onClick={closeSidebar}
                className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-neutral-100 transition-colors"
              >
                Introduction
              </a>
            </li>
          </ul>
          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest pt-4 px-2">
            API modules
          </p>
          {docs.tags.map((tag) => (
            <div key={tag.name}>
              <a
                href={`#tag-${tag.name.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={closeSidebar}
                className="block py-2 px-3 rounded-lg text-neutral-300 hover:bg-white/5 hover:text-neutral-50 font-medium transition-colors"
              >
                {tag.name}
              </a>
              <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-neutral-800 pl-3">
                {tag.endpoints.map((ep) => (
                  <li key={ep.endpoint_id}>
                    <a
                      href={`#${ep.endpoint_id}`}
                      onClick={closeSidebar}
                      className="flex items-center gap-2 py-1.5 px-2 rounded text-sm text-neutral-500 hover:bg-white/5 hover:text-neutral-200 transition-colors"
                    >
                      <span
                        className={`method method-${ep.method.toLowerCase()} shrink-0`}
                      >
                        {ep.method}
                      </span>
                      <span className="truncate">
                        {(ep.summary || ep.path).slice(0, 36)}
                        {(ep.summary || ep.path).length > 36 ? "…" : ""}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Right-side chat: container above, input + button below (outside, no divider) */}
      <div
        className="fixed top-20 right-0 bottom-0 w-[min(320px,90vw)] hidden lg:flex flex-col z-10
          lg:right-4 lg:top-24 lg:bottom-4 lg:w-[var(--chat-width)] gap-3"
      >
        <aside className="flex-1 min-h-0 flex flex-col rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-xl shadow-lg shadow-black/20 overflow-hidden">
          <div className="p-3">
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest">
              Chat
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 flex flex-col">
            {chatMessages.length === 0 && (
              <p className="text-neutral-500 text-sm">
                Ask about this API or request code examples.
              </p>
            )}
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words ${
                    m.role === "user"
                      ? "bg-emerald-600/90 text-white rounded-br-md"
                      : "bg-neutral-700/80 text-neutral-100 rounded-bl-md"
                  } ${m.role === "assistant" ? "chat-markdown" : ""}`}
                >
                  <span
                    className={`font-medium text-[10px] uppercase tracking-wide block mb-1 ${
                      m.role === "user"
                        ? "text-emerald-100"
                        : "text-neutral-400"
                    }`}
                  >
                    {m.role === "user" ? "You" : "Assistant"}
                  </span>
                  {m.role === "user" ? (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-base font-semibold mt-2 mb-1 first:mt-0">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm font-semibold mt-2 mb-1 first:mt-0">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-medium mt-1.5 mb-0.5 first:mt-0">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="my-1 last:mb-0">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside my-1 space-y-0.5">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside my-1 space-y-0.5">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed">{children}</li>
                        ),
                        code: ({ className, children }) => {
                          const isBlock = className?.startsWith("language-");
                          if (isBlock) {
                            return (
                              <code
                                className={className}
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {children}
                              </code>
                            );
                          }
                          return (
                            <code className="bg-neutral-800/80 px-1 py-0.5 rounded text-neutral-200 font-mono text-xs">
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => (
                          <pre className="!mt-2 !mb-2 overflow-x-auto rounded-lg bg-neutral-900/90 p-2 text-xs border border-neutral-600/50 [&>code]:!p-0 [&>code]:!bg-transparent">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-neutral-500 pl-2 my-1 text-neutral-300 italic">
                            {children}
                          </blockquote>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-neutral-50">
                            {children}
                          </strong>
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <p className="text-neutral-500 text-sm">Thinking…</p>
            )}
          </div>
        </aside>
        <div className="shrink-0 flex flex-col gap-2">
          {/* Single container: chips + input + send button at bottom-right */}
          <div className="relative flex-1 min-w-0">
            <form onSubmit={sendChat} className="block">
              <div className="relative min-h-[80px] py-3 px-3 pr-14 pb-14 rounded-2xl bg-neutral-900/80 border border-white/10 focus-within:ring-1 focus-within:ring-white/20 flex flex-wrap items-center gap-2 content-start">
                {contextTagNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 pl-2.5 pr-1 py-0.5 text-xs font-medium shrink-0"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeContextTag(name)}
                      className="rounded-full p-0.5 hover:bg-emerald-500/30 transition-colors"
                      aria-label={`Remove ${name} from context`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
                <textarea
                  ref={chatInputRef}
                  rows={1}
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    setAtMentionHighlight(0);
                    resizeTextarea();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      if (showAtOverlay && matchingTags.length > 0) {
                        const idx = Math.min(
                          atMentionHighlight,
                          matchingTags.length - 1
                        );
                        if (matchingTags[idx]) {
                          e.preventDefault();
                          applyAtMention(matchingTags[idx].name);
                        }
                      } else {
                        e.preventDefault();
                        const form = e.currentTarget.form;
                        if (form && chatInput.trim()) form.requestSubmit();
                      }
                      return;
                    }
                    if (e.key === "Escape") {
                      setChatInput((prev) =>
                        prev.replace(/@[^\s]*$/, "").trimEnd()
                      );
                      return;
                    }
                    if (showAtOverlay && matchingTags.length > 0) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setAtMentionHighlight(
                          (i) => (i + 1) % matchingTags.length
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setAtMentionHighlight(
                          (i) =>
                            (i - 1 + matchingTags.length) % matchingTags.length
                        );
                      }
                    }
                  }}
                  placeholder={
                    contextTagNames.length > 0
                      ? "Ask… (@ for more context)"
                      : "Ask about the API… (@ for module context)"
                  }
                  className="flex-1 w-full min-w-0 max-h-[200px] resize-none overflow-y-auto bg-transparent border-0 py-1 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-0 [&::-webkit-resizer]:hidden"
                  disabled={chatLoading}
                  style={{ height: "auto", resize: "none" }}
                />
                {/* Send button at bottom-right inside the same container */}
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:pointer-events-none disabled:bg-white/10 disabled:text-neutral-200 flex items-center justify-center transition-colors"
                  aria-label="Send"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                </button>
              </div>
            </form>
            {/* @ overlay — module options as chips */}
            {showAtOverlay && (
              <div
                className="absolute left-0 right-0 bottom-full mb-1 rounded-xl border border-white/10 bg-neutral-900 shadow-lg overflow-hidden z-50 p-2 min-w-[160px]"
                role="listbox"
              >
                {matchingTags.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-1">No match</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {matchingTags.map((tag, i) => {
                      const safeHighlight = Math.min(
                        atMentionHighlight,
                        matchingTags.length - 1
                      );
                      return (
                        <button
                          key={tag.name}
                          type="button"
                          role="option"
                          aria-selected={i === safeHighlight}
                          onClick={() => applyAtMention(tag.name)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            i === safeHighlight
                              ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                              : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700 hover:text-neutral-300"
                          }`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content wrapper: padding reserves space for fixed sidebars so main never overlaps */}
      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col pt-20
          pl-0 pr-0 lg:pl-[calc(var(--side-width)+var(--side-gap)*2)] lg:pr-[calc(var(--chat-width)+var(--side-gap)*2)]"
      >
        <main className="min-h-[calc(100vh-5rem)] min-w-0 flex-1 w-full p-4 sm:p-6 lg:p-10">
          <section id="overview" className="mb-12">
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-50 mb-2 tracking-tight">
              Overview
            </h1>
            {docs.version && (
              <p className="text-neutral-500 text-sm mb-4">
                Version {docs.version}
              </p>
            )}
            {(docs.overview_summary ?? docs.description) && (
              <div className="text-neutral-400 text-sm sm:text-base whitespace-pre-wrap mb-6 overflow-x-hidden leading-relaxed">
                {docs.overview_summary ?? docs.description}
              </div>
            )}
            <h2
              id="overview-modules"
              className="text-base sm:text-lg font-medium text-neutral-100 mb-4 tracking-tight"
            >
              Modules
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 sm:gap-4">
              {docs.tags.map((tag) => (
                <a
                  key={tag.name}
                  href={`#tag-${tag.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="block p-4 rounded-xl bg-card border border-neutral-800 hover:border-neutral-600 text-neutral-100 transition-colors"
                >
                  <span className="font-medium block">{tag.name}</span>
                  <span className="text-sm text-neutral-500">
                    {tag.endpoints.length} endpoint
                    {tag.endpoints.length !== 1 ? "s" : ""}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {docs.tags.map((tag) => (
            <TagSection
              key={tag.name}
              tag={tag}
              baseUrl={docs.base_url}
              openapiUrl={openapiUrl}
              stacks={docs.stacks}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

function TagSection({
  tag,
  baseUrl,
  openapiUrl,
  stacks,
}: {
  tag: DocsTag;
  baseUrl: string;
  openapiUrl: string | null;
  stacks: { value: string; label: string }[];
}) {
  const tagId = `tag-${tag.name.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section id={tagId} className="mb-10 sm:mb-12">
      <h2 className="text-lg sm:text-xl font-medium text-neutral-50 border-b border-neutral-800 pb-3 mb-5 sm:mb-6 tracking-tight">
        {tag.name}
      </h2>
      {tag.endpoints.map((ep) => (
        <EndpointCard
          key={ep.endpoint_id}
          endpoint={ep}
          baseUrl={baseUrl}
          openapiUrl={openapiUrl}
          stacks={stacks}
        />
      ))}
    </section>
  );
}

function EndpointCard({
  endpoint,
  baseUrl,
  openapiUrl,
  stacks,
}: {
  endpoint: DocsEndpoint;
  baseUrl: string;
  openapiUrl: string | null;
  stacks: { value: string; label: string }[];
}) {
  const [selectedStack, setSelectedStack] = useState(stacks[0]?.value ?? "");
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setGenError(null);
    setCode(null);
    try {
      const body: Record<string, string | null> = {
        path: endpoint.path,
        method: endpoint.method,
        stack: selectedStack,
        base_url: baseUrl,
      };
      if (openapiUrl) body.openapi_url = openapiUrl;
      const res = await fetch(GENERATE_EXAMPLE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: GenerateExampleResponse | { detail?: string } =
        await res.json();
      if (!res.ok)
        throw new Error((data as { detail?: string }).detail || res.statusText);
      setCode((data as GenerateExampleResponse).code);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <article
      id={endpoint.endpoint_id}
      className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl bg-card border border-neutral-800"
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2 min-w-0">
        <span
          className={`method method-${endpoint.method.toLowerCase()} shrink-0`}
        >
          {endpoint.method}
        </span>
        <code className="text-xs sm:text-sm text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded-lg break-all min-w-0 font-mono">
          {endpoint.path}
        </code>
      </div>
      {endpoint.summary && (
        <p className="font-medium text-neutral-100 mb-2">{endpoint.summary}</p>
      )}
      {endpoint.description && (
        <div className="text-neutral-500 text-sm whitespace-pre-wrap mb-4 leading-relaxed">
          {endpoint.description}
        </div>
      )}

      <div className="mb-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
        <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest mb-2">
          Request
        </p>
        <pre className="text-sm text-neutral-300 overflow-x-auto font-mono">
          <span className={`method method-${endpoint.method.toLowerCase()}`}>
            {endpoint.method}
          </span>{" "}
          {endpoint.how_to_call.full_url}
        </pre>
        {(endpoint.how_to_call.needs_auth || endpoint.how_to_call.has_body) && (
          <p className="text-xs text-neutral-500 mt-2">
            Headers:{" "}
            {endpoint.how_to_call.needs_auth && "Authorization: Bearer <token>"}
            {endpoint.how_to_call.needs_auth &&
              endpoint.how_to_call.has_body &&
              ", "}
            {endpoint.how_to_call.has_body && "Content-Type: application/json"}
          </p>
        )}
      </div>

      <div className="mb-4 p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
        <h4 className="text-sm font-medium text-neutral-200 mb-1">
          Get code for your stack
        </h4>
        <p className="text-neutral-500 text-sm mb-3">
          Pick a framework and we’ll generate a ready-to-use example.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex flex-col gap-1.5 min-w-0 sm:min-w-[220px]">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Framework
            </span>
            <Select value={selectedStack} onValueChange={setSelectedStack}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Web</SelectLabel>
                  {stacks
                    .filter(
                      (s) =>
                        ![
                          "react-native",
                          "flutter",
                          "swift-ios",
                          "kotlin-android",
                        ].includes(s.value)
                    )
                    .map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Mobile</SelectLabel>
                  {stacks
                    .filter((s) =>
                      [
                        "react-native",
                        "flutter",
                        "swift-ios",
                        "kotlin-android",
                      ].includes(s.value)
                    )
                    .map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="sm:self-end px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-white disabled:opacity-50 text-neutral-900 text-sm font-medium touch-manipulation transition-colors shrink-0"
          >
            {loading ? "Generating…" : "Generate example"}
          </button>
        </div>
        {genError && (
          <p className="text-neutral-400 text-sm mt-3">{genError}</p>
        )}
        {code && (
          <div className="relative mt-2 -mx-1 sm:mx-0">
            <pre className="p-3 sm:p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs sm:text-sm text-neutral-300 overflow-x-auto max-w-full font-mono">
              <code className="block min-w-0">{code}</code>
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-lg text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {endpoint.parameters.length > 0 && (
        <div className="mb-4 overflow-x-auto -mx-1 sm:mx-0">
          <h4 className="text-sm font-medium text-neutral-200 mb-2">
            Parameters
          </h4>
          <table className="w-full min-w-[400px] text-sm border-collapse border border-neutral-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-neutral-900/80">
                <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                  Name
                </th>
                <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                  In
                </th>
                <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                  Required
                </th>
                <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoint.parameters.map((p) => (
                <tr key={p.name} className="border-b border-neutral-800/80">
                  <td className="p-3">
                    <code className="text-neutral-200 font-mono text-xs">
                      {p.name}
                    </code>
                  </td>
                  <td className="p-3 text-neutral-500">{p.in}</td>
                  <td className="p-3 text-neutral-500">
                    {p.required ? "required" : "optional"}
                  </td>
                  <td className="p-3 text-neutral-500">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {endpoint.request_body_schema && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-neutral-200 mb-2">
            Request body
          </h4>
          {endpoint.request_body_schema.description && (
            <p className="text-neutral-500 text-sm mb-2">
              {endpoint.request_body_schema.description}
            </p>
          )}
          {endpoint.request_body_schema.schema?.properties && (
            <div className="overflow-x-auto -mx-1 sm:mx-0">
              <table className="w-full min-w-[400px] text-sm border-collapse border border-neutral-800 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-neutral-900/80">
                    <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                      Field
                    </th>
                    <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                      Type
                    </th>
                    <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                      Required
                    </th>
                    <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.request_body_schema.schema.properties.map(
                    (prop) => (
                      <tr
                        key={prop.name}
                        className="border-b border-neutral-800/80"
                      >
                        <td className="p-3">
                          <code className="text-neutral-200 font-mono text-xs">
                            {prop.name}
                          </code>
                        </td>
                        <td className="p-3 text-neutral-500">{prop.type}</td>
                        <td className="p-3 text-neutral-500">
                          {prop.required ? "required" : "optional"}
                        </td>
                        <td className="p-3 text-neutral-500">
                          {prop.description}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {endpoint.responses.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-200 mb-2">
            Responses
          </h4>
          <ul className="space-y-4">
            {endpoint.responses.map((r) => (
              <li
                key={r.code}
                className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-2"
              >
                <p className="text-sm">
                  <strong className="text-neutral-200">{r.code}</strong>:{" "}
                  <span className="text-neutral-500">{r.description}</span>
                </p>
                {r.body_schema?.properties &&
                  r.body_schema.properties.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                        Response body
                      </p>
                      <div className="overflow-x-auto -mx-1 sm:mx-0">
                        <table className="w-full min-w-[400px] text-sm border-collapse border border-neutral-800 rounded-xl overflow-hidden">
                          <thead>
                            <tr className="bg-neutral-900/80">
                              <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                                Field
                              </th>
                              <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                                Type
                              </th>
                              <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                                Required
                              </th>
                              <th className="text-left p-3 border-b border-neutral-800 text-neutral-300 font-medium">
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.body_schema.properties.map((prop) => (
                              <tr
                                key={prop.name}
                                className="border-b border-neutral-800/80"
                              >
                                <td className="p-3">
                                  <code className="text-neutral-200 font-mono text-xs">
                                    {prop.name}
                                  </code>
                                </td>
                                <td className="p-3 text-neutral-500">
                                  {prop.type}
                                </td>
                                <td className="p-3 text-neutral-500">
                                  {prop.required ? "required" : "optional"}
                                </td>
                                <td className="p-3 text-neutral-500">
                                  {prop.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                {r.body_schema && !r.body_schema.properties?.length && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Body type:{" "}
                    <code className="text-neutral-400">
                      {r.body_schema.type ?? "object"}
                    </code>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
