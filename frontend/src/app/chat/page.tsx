"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { AnswerSource, askSupportQuestion, fetchDocumentPreview } from "../services/answers";

type Message = {
  id: number;
  role: "assistant" | "customer";
  content: string;
  sources?: AnswerSource[];
};

const suggestedQuestions = [
  "How do I deploy my first CloudForge CDK service safely, from setup through verification?",
  "Which rollout strategy should I use, and what health signals mean I should pause or roll back?",
  "How do I safely review a preview environment and verify a custom domain and HTTPS before sharing it?",
];

export default function SupportChatPage() {
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [previewSource, setPreviewSource] = useState<AnswerSource | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const previewAbortRef = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content:
        "Hi! I’m the CloudForge support assistant. Ask me a question and I’ll look through the support guides to find a helpful answer.",
    },
  ]);
  const nextMessageId = useRef(1);
  const conversationEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function openSourcePreview(source: AnswerSource) {
    previewAbortRef.current?.abort();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const controller = new AbortController();
    previewAbortRef.current = controller;
    setPreviewSource(source);
    setPreviewUrl("");
    setPreviewError("");
    setPreviewLoading(true);

    try {
      const blob = await fetchDocumentPreview(source.document_id, controller.signal);
      if (previewAbortRef.current !== controller) return;
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (previewRequestError) {
      if (controller.signal.aborted) return;
      setPreviewError(
        previewRequestError instanceof Error
          ? previewRequestError.message
          : "We couldn’t load this source document. Please try again.",
      );
    } finally {
      if (previewAbortRef.current === controller) setPreviewLoading(false);
    }
  }

  function closeSourcePreview() {
    previewAbortRef.current?.abort();
    previewAbortRef.current = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewSource(null);
    setPreviewUrl("");
    setPreviewError("");
  }

  async function sendQuestion(value: string) {
    const trimmedQuestion = value.trim();
    if (!trimmedQuestion || sending) return;

    setError("");
    setQuestion("");
    setMessages((current) => [
      ...current,
      { id: nextMessageId.current++, role: "customer", content: trimmedQuestion },
    ]);
    setSending(true);

    try {
      const result = await askSupportQuestion(trimmedQuestion);
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId.current++,
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "We couldn’t get an answer right now. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(question);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion(question);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#080b10] text-white selection:bg-cyan-300/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(17,97,125,0.19),transparent_48%)]" />
      <header className="relative z-10 flex h-[78px] shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#080b10]/70 px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-lg font-bold text-[#061016]">
            C
          </div>
          <div>
            <p className="font-semibold tracking-tight">CloudForge</p>
            <p className="text-xs text-slate-400">Support chat</p>
          </div>
        </div>
        <Link href="/" className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/90 transition hover:border-cyan-200/50 hover:text-cyan-100 sm:text-sm">Back to CloudForge</Link>
      </header>

      <section
        aria-label="Support conversation"
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 sm:px-8"
      >
        <div className="flex-1 space-y-7 overflow-y-auto py-8 sm:py-12">
          {messages.length === 1 && (
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-2xl text-cyan-200">
                ✦
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                How can we help?
              </h1>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">
                Ask a question about CloudForge. Answers are based on your support documentation.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex gap-3 sm:gap-4 ${message.role === "customer" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-sm font-semibold text-[#061016]">
                  C
                </div>
              )}
              <div className={`max-w-[88%] sm:max-w-[78%] ${message.role === "customer" ? "order-first" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-3.5 text-sm leading-6 sm:px-5 ${
                    message.role === "customer"
                      ? "rounded-br-md bg-cyan-300 text-[#071017]"
                      : "rounded-tl-md border border-white/[0.08] bg-[#151e29] text-slate-200"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="space-y-3 break-words">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-lg font-semibold leading-snug text-white">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base font-semibold leading-snug text-white">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-semibold leading-snug text-white">{children}</h3>
                          ),
                          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                          strong: ({ children }) => (
                            <strong className="font-semibold text-white">{children}</strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc space-y-1 pl-5 marker:text-cyan-300">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal space-y-1 pl-5 marker:text-cyan-300">{children}</ol>
                          ),
                          li: ({ children }) => <li className="pl-1">{children}</li>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-cyan-300/50 pl-3 text-slate-300">
                              {children}
                            </blockquote>
                          ),
                          pre: ({ children }) => (
                            <pre className="overflow-x-auto rounded-lg bg-[#080d13] p-3 text-xs leading-5">
                              {children}
                            </pre>
                          ),
                          code: ({ className, children, ...props }) => {
                            const isBlock = className?.startsWith("language-");
                            return (
                              <code
                                {...props}
                                className={
                                  isBlock
                                    ? `font-mono text-xs text-cyan-100 ${className}`
                                    : "rounded bg-black/30 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-100"
                                }
                              >
                                {children}
                              </code>
                            );
                          },
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-200 underline underline-offset-2 hover:text-cyan-100"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Sources
                    </p>
                    {message.sources.map((source) => (
                      <div
                        key={`${message.id}-${source.citation}`}
                        className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#111923] text-sm"
                      >
                        <div className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2.5 text-slate-200">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-300/10 text-xs font-semibold text-cyan-200">
                              {source.citation}
                            </span>
                            <span className="truncate font-medium">{source.filename}</span>
                            <span className="shrink-0 text-xs text-slate-500">Page {source.page_number}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void openSourcePreview(source)}
                            className="shrink-0 rounded-lg border border-cyan-200/20 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-200/[0.06]"
                          >
                            Preview document
                          </button>
                        </div>
                        <details className="border-t border-white/[0.07] text-xs">
                          <summary className="cursor-pointer px-4 py-2.5 text-slate-400 hover:text-slate-200">
                            Show cited excerpt
                          </summary>
                          <p className="border-t border-white/[0.07] px-4 py-3 leading-5 text-slate-400">
                            {source.passage}
                          </p>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {message.role === "customer" && (
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-semibold text-slate-300">
                  Y
                </div>
              )}
            </article>
          ))}

          {sending && (
            <div className="flex items-center gap-3" role="status" aria-live="polite">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300 text-sm font-semibold text-[#061016]">C</div>
              <div className="rounded-2xl rounded-tl-md border border-white/[0.08] bg-[#151e29] px-5 py-4">
                <span className="sr-only">Searching the support guides</span>
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300" />
                </span>
              </div>
            </div>
          )}
          <div ref={conversationEnd} />
        </div>

        {messages.length === 1 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {suggestedQuestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={sending}
                onClick={() => void sendQuestion(suggestion)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-300 transition hover:border-cyan-200/40 hover:bg-cyan-200/[0.06] hover:text-cyan-100 disabled:opacity-50 sm:text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="pb-5 sm:pb-8">
          {error && (
            <div role="alert" className="mb-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#111923] p-2 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] focus-within:border-cyan-200/40">
            <label htmlFor="customer-question" className="sr-only">Your question</label>
            <textarea
              id="customer-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Write your question…"
              rows={2}
              maxLength={2000}
              disabled={sending}
              className="block max-h-40 min-h-[56px] w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-60"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-xs text-slate-500">Enter to send · Shift + Enter for a new line</p>
              <button
                type="submit"
                disabled={!question.trim() || sending}
                aria-label="Send question"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300 text-[#071017] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M10 15.5V4.5M5.5 9 10 4.5 14.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>
          <p className="mt-3 text-center text-xs text-slate-500">
            AI responses can make mistakes. Check the cited support guides for details.
          </p>
        </div>
      </section>

      {previewSource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03070d]/80 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="source-preview-title"
        >
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-200/15 bg-[#0b121c] shadow-[0_30px_100px_-30px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#101a27] px-5 py-4 sm:px-6">
              <div className="min-w-0 pr-4">
                <h2 id="source-preview-title" className="truncate text-base font-semibold text-white">
                  {previewSource.filename}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  <span className="mr-2 rounded-full border border-cyan-200/20 bg-cyan-200/[0.06] px-2 py-0.5 text-cyan-100">
                    Source {previewSource.citation}
                  </span>
                  Cited on page {previewSource.page_number}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSourcePreview}
                aria-label="Close document preview"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-lg text-slate-300 transition hover:border-cyan-200/30 hover:bg-cyan-200/[0.08] hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-[#080d13] p-2 sm:p-4">
              {previewLoading && (
                <div className="flex items-center gap-3 text-sm text-slate-300" role="status">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
                  Loading document...
                </div>
              )}
              {!previewLoading && previewError && (
                <p className="rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-5 py-4 text-sm text-rose-200">
                  {previewError}
                </p>
              )}
              {!previewLoading && previewUrl && (
                <iframe
                  title={`Preview of ${previewSource.filename}`}
                  src={`${previewUrl}#toolbar=0&navpanes=0&page=${previewSource.page_number}`}
                  className="h-full w-full rounded-lg border border-white/10 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
