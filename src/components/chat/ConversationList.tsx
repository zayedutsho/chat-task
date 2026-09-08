"use client";

import Avatar from "./Avatar";
import type { Conversation } from "../../types/conversation";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  isLoading: boolean;
  error: string;
  emptyMessage?: string;
  getTitle: (conversation: Conversation) => string;
  onRetry: () => void;
  onSelect: (id: string) => void;
}

/** Compact sidebar timestamp: time today, weekday this week, otherwise a short date. */
function formatListTime(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  const daysAgo = (now.getTime() - date.getTime()) / 86_400_000;
  if (daysAgo >= 0 && daysAgo < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ConversationList({
  conversations,
  selectedId,
  isLoading,
  error,
  emptyMessage = "No conversations yet.",
  getTitle,
  onRetry,
  onSelect,
}: ConversationListProps) {
  return (
    <div aria-busy={isLoading} className="flex min-h-0 flex-1 flex-col px-3 pb-3">
      {isLoading ? (
        <p role="status" className="px-2 py-8 text-sm text-slate-500">
          Loading conversations...
        </p>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p role="alert" className="text-sm leading-6 text-red-700">
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg border border-emerald-200 bg-white px-3.5 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Retry
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="px-2 py-8">
          <p className="text-sm font-medium text-slate-800">{emptyMessage}</p>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Search for someone above to start talking.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {conversations.map((conversation) => {
            const isSelected = conversation.id === selectedId;
            const title = getTitle(conversation);
            const time = formatListTime(conversation.lastMessage?.createdAt);

            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-start gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-700 ${
                    isSelected
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <Avatar name={title} tone={isSelected ? "emerald" : "slate"} />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate text-sm font-semibold ${
                          isSelected ? "text-emerald-950" : "text-slate-900"
                        }`}
                        title={title}
                      >
                        {title}
                      </span>
                      {time && (
                        <span className="shrink-0 font-mono text-[10px] text-slate-500">
                          {time}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {conversation.type === "group" ? "Group" : "Direct"}
                      {" · "}
                      {conversation.lastMessage?.text || "No messages yet"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
