"use client";

import type { Conversation } from "../../types/conversation";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  isLoading: boolean;
  error: string;
  getTitle: (conversation: Conversation) => string;
  onRetry: () => void;
  onSelect: (id: string) => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  isLoading,
  error,
  getTitle,
  onRetry,
  onSelect,
}: ConversationListProps) {
  return (
    <div aria-busy={isLoading} className="p-3">
      {isLoading ? (
        <p role="status" className="px-3 py-8 text-sm text-slate-500">
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
            className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Retry
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="px-3 py-8">
          <p className="text-sm font-medium">No conversations yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your conversations will appear here.
          </p>
        </div>
      ) : (
        <>
          <ul className="max-h-[45dvh] space-y-1 overflow-y-auto md:max-h-[calc(100dvh-17rem)]">
            {conversations.map((conversation) => {
              const isSelected = conversation.id === selectedId;
              const title = getTitle(conversation);

              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-pressed={isSelected}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-700 ${
                      isSelected
                        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-xs text-slate-500">
                      {conversation.type === "group" ? "Group" : "Direct"}
                    </span>
                    <span className="mt-1 block truncate text-sm font-semibold" title={title}>
                      {title}
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-600">
                      {conversation.lastMessage?.text || "No messages yet"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
