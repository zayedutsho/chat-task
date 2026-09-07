"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../../lib/api/auth";
import type { User } from "../../types/user";
import { searchUsers } from "../../lib/api/users";
import { createConversation, getConversations } from "../../lib/api/conversations";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [creatingUserId, setCreatingUserId] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) return;

    let ignore = false;
    const timeout = setTimeout(() => {
      searchUsers(query)
        .then((users) => {
          if (!ignore) {
            const storedUser = getCurrentUser();
            setSearchResults(users.filter((user) => user.id !== storedUser?.id));
          }
        })
        .catch(() => {
          if (!ignore) setSearchError("We couldn't search for people. Please try again.");
        })
        .finally(() => {
          if (!ignore) setIsSearching(false);
        });
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [searchQuery]);

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

  async function startConversation(user: User) {
    if (creatingUserId || isLoading) return;

    setCreatingUserId(user.id);
    setCreateError("");

    try {
      const created = await createConversation({ userId: user.id });
      setSearchQuery("");
      setSearchResults([]);
      setIsSearching(false);
      setSearchError("");
      setError("");
      setIsLoading(true);

      try {
        const refreshed = await getConversations();
        setConversations(refreshed);
        setCurrentUser(getCurrentUser());
        if (refreshed.some((conversation) => conversation.id === created.id)) {
          setSelectedId(created.id);
        }
      } catch {
        setError("Your conversation was created, but we couldn't refresh the list. Please retry.");
      } finally {
        setIsLoading(false);
      }
    } catch {
      setCreateError("We couldn't start this conversation. Please try again.");
    } finally {
      setCreatingUserId(null);
    }
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

          <div className="border-b border-slate-100 px-5 py-4">
            <label htmlFor="user-search" className="block text-sm font-medium text-slate-700">
              Find someone
            </label>
            <input
              id="user-search"
              type="search"
              value={searchQuery}
              disabled={creatingUserId !== null}
              onChange={(event) => {
                const value = event.target.value;
                setSearchQuery(value);
                setSearchResults([]);
                setSearchError("");
                setCreateError("");
                setIsSearching(Boolean(value.trim()));
              }}
              placeholder="Search by name or phone"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 disabled:opacity-60"
            />
            {createError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {createError}
              </p>
            )}
          </div>

          {searchQuery.trim() ? (
            <div aria-busy={isSearching || creatingUserId !== null} className="p-3">
              {isSearching ? (
                <p role="status" className="px-3 py-4 text-sm text-slate-500">
                  Searching...
                </p>
              ) : searchError ? (
                <p role="alert" className="px-3 py-4 text-sm text-red-700">
                  {searchError}
                </p>
              ) : searchResults.length === 0 ? (
                <p role="status" className="px-3 py-4 text-sm text-slate-500">
                  No matching people found.
                </p>
              ) : (
                <ul aria-label="Search results" className="max-h-[45dvh] space-y-1 overflow-y-auto">
                  {searchResults.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => startConversation(user)}
                        disabled={creatingUserId !== null || isLoading}
                        className="w-full rounded-xl px-4 py-3 text-left hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="block truncate text-sm font-semibold">{user.name}</span>
                        <span className="mt-1 block truncate text-sm text-slate-500">{user.phone}</span>
                        {creatingUserId === user.id && (
                          <span role="status" className="mt-1 block text-xs text-emerald-800">
                            Starting conversation...
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
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
          )}
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
