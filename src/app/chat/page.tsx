"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../../lib/api/auth";
import type { User } from "../../types/user";
import { getConversations } from "../../lib/api/conversations";
import type { Conversation } from "../../types/conversation";

function getConversationTitle(conversation: Conversation, currentUser: User | null): string {
  if (conversation.type === "group") {
    return conversation.name?.trim() || "Unnamed group";
  }

  if (!currentUser) return "Direct conversation";

  return (
    conversation.participants.find((participant) => participant.id !== currentUser.id)
      ?.name || "Direct conversation"
  );
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getConversations()
      .then((data) => {
        if (!ignore) {
          setCurrentUser(getCurrentUser());
          setConversations(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("We couldn't load your conversations. Please try again.");
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    // Ignore responses from an earlier request or an unmounted page.
    return () => {
      ignore = true;
    };
  }, [requestVersion]);

  function retry() {
    setError("");
    setIsLoading(true);
    setRequestVersion((version) => version + 1);
  }

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId,
  );

  return (
    <main className="min-h-dvh bg-slate-50 p-3 text-slate-900 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[320px_minmax(0,1fr)]">
        <aside
          aria-label="Conversations"
          className="min-w-0 border-b border-slate-200 md:border-r md:border-b-0"
        >
          <header className="border-b border-slate-100 px-5 py-6">
            <p className="text-xs font-semibold tracking-widest text-emerald-800 uppercase">
              Your chats
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Conversations
            </h1>
          </header>

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
                  onClick={retry}
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
                    const title = getConversationTitle(conversation, currentUser);

                    return (
                      <li key={conversation.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(conversation.id)}
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
        </aside>

        <section
          aria-label="Selected conversation"
          aria-live="polite"
          className="min-h-48 min-w-0"
        >
          {selectedConversation ? (
            <header className="border-b border-slate-100 px-6 py-6">
              <h2 className="text-lg font-semibold break-words">
                {getConversationTitle(selectedConversation, currentUser)}
              </h2>
            </header>
          ) : (
            <div className="flex h-full min-h-48 items-center justify-center p-8">
              <h2 className="text-lg font-medium text-slate-500">
                Select a conversation
              </h2>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
