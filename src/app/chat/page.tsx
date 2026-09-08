"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuthGuard from "../../components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import { House, LogOut, Users } from "lucide-react";
import { getCurrentUser, logout } from "../../lib/api/auth";
import type { User } from "../../types/user";
import { getChatSocket } from "../../lib/socket";
import { searchUsers } from "../../lib/api/users";
import { createConversation, getConversations } from "../../lib/api/conversations";
import type { Conversation } from "../../types/conversation";
import Avatar from "../../components/chat/Avatar";
import CreateGroupPanel from "../../components/chat/CreateGroupPanel";
import ChatPanel from "../../components/chat/ChatPanel";
import ConversationList from "../../components/chat/ConversationList";
import UserSearch from "../../components/chat/UserSearch";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "direct", label: "Direct" },
  { value: "group", label: "Groups" },
] as const;

type ConversationFilter = (typeof FILTERS)[number]["value"];

const EMPTY_MESSAGES: Record<ConversationFilter, string> = {
  all: "No conversations yet.",
  direct: "No direct conversations yet.",
  group: "No group conversations yet.",
};

const iconActionClass =
  "flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60";

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
  return (
    <AuthGuard>
      <ChatContent />
    </AuthGuard>
  );
}

function ChatContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const latestConversationRequest = useRef(0);

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

    const request = ++latestConversationRequest.current;
    getConversations()
      .then((data) => {
        if (!ignore && request === latestConversationRequest.current) {
          setCurrentUser(getCurrentUser());
          setConversations(data);
          setError("");
        }
      })
      .catch(() => {
        if (!ignore && request === latestConversationRequest.current) {
          setError("We couldn't load your conversations. Please try again.");
        }
      })
      .finally(() => {
        if (!ignore && request === latestConversationRequest.current) setIsLoading(false);
      });

    // Ignore responses from an earlier request or an unmounted page.
    return () => {
      ignore = true;
    };
  }, [requestVersion]);

  const refreshConversations = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;

    function onConnect() {
      if (process.env.NODE_ENV === "development") console.info("Chat socket connected.");
      setIsRealtimeConnected(true);
      refreshConversations();
    }
    function onConnectError() {
      if (process.env.NODE_ENV === "development") console.warn("Chat socket connection failed.");
      setIsRealtimeConnected(false);
    }
    function onDisconnect() {
      if (process.env.NODE_ENV === "development") console.info("Chat socket disconnected.");
      setIsRealtimeConnected(false);
    }

    socket.on("message:new", refreshConversations);
    socket.on("conversation:updated", refreshConversations);
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.connect();

    return () => {
      socket.off("message:new", refreshConversations);
      socket.off("conversation:updated", refreshConversations);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [refreshConversations]);

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
        const request = ++latestConversationRequest.current;
        const refreshed = await getConversations();
        if (request === latestConversationRequest.current) setConversations(refreshed);
        setCurrentUser(getCurrentUser());
        if (refreshed.some((conversation) => conversation.id === created.id)) {
          setSelectedId(created.id);
          setMobileChatOpen(true);
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

  function handleLogout() {
    const socket = getChatSocket();
    try {
      logout();
      socket?.disconnect();
      setCurrentUser(null);
      setSelectedId(null);
      router.replace("/login");
    } catch {
      setError("We couldn't sign you out. Please try again.");
    }
  }

  const filteredConversations = conversations.filter(
    (conversation) => filter === "all" || conversation.type === filter,
  );

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId,
  );

  return (
    <main className="h-dvh overflow-hidden bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-950">
      <div className="grid h-full min-h-0 min-w-0 md:grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[344px_minmax(0,1fr)]">
        <aside
          aria-label="Conversations"
          className={`h-full min-h-0 min-w-0 flex-col overflow-hidden border-slate-200 md:flex md:border-r ${mobileChatOpen && selectedConversation ? "hidden" : "flex"}`}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-3">
            <Avatar name={currentUser?.name || "?"} tone="emerald" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" title={currentUser?.name}>
                {currentUser?.name || "Your profile"}
              </p>
              <p className="text-xs text-slate-500">Available</p>
            </div>
            <nav aria-label="Chat navigation" className="flex shrink-0">
              <Link href="/" aria-label="Home" title="Home" className={iconActionClass}>
                <House aria-hidden="true" className="size-4" />
              </Link>
              <button
                type="button"
                onClick={() => setIsGroupOpen(true)}
                disabled={isGroupOpen || !currentUser || creatingUserId !== null}
                aria-label="New group"
                title="New group"
                aria-expanded={isGroupOpen}
                aria-controls={isGroupOpen ? "create-group-panel" : undefined}
                className={iconActionClass}
              >
                <Users aria-hidden="true" className="size-4" />
              </button>
              <button type="button" onClick={handleLogout} aria-label="Logout" title="Logout" className={iconActionClass}>
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </nav>
          </div>
          <header className="shrink-0 px-4 pt-5 pb-4">
            <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-emerald-800 uppercase">
              Your chats
            </p>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight">Conversations</h1>
          </header>

          {isGroupOpen && currentUser ? (
            <CreateGroupPanel
              currentUser={currentUser}
              onCancel={() => setIsGroupOpen(false)}
              onCreated={() => {
                setIsGroupOpen(false);
                setSearchQuery("");
                setSearchResults([]);
                setSearchError("");
                setIsSearching(false);
                setError("");
                setIsLoading(true);
                refreshConversations();
              }}
            />
          ) : (
          <UserSearch
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            searchError={searchError}
            creatingUserId={creatingUserId}
            createError={createError}
            isConversationLoading={isLoading}
            onQueryChange={(value) => {
              setSearchQuery(value);
              setSearchResults([]);
              setSearchError("");
              setCreateError("");
              setIsSearching(Boolean(value.trim()));
            }}
            onStartConversation={startConversation}
          />
          )}
          {!isGroupOpen && !searchQuery.trim() && (
            <div role="group" aria-label="Filter conversations" className="mx-4 mb-3 grid shrink-0 grid-cols-3 rounded-xl bg-slate-100 p-1">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={filter === item.value}
                  onClick={() => setFilter(item.value)}
                  className={`min-h-10 rounded-lg px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-emerald-700 ${
                    filter === item.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {!isGroupOpen && !searchQuery.trim() && (
            <ConversationList
              conversations={filteredConversations}
              emptyMessage={EMPTY_MESSAGES[filter]}
              selectedId={selectedId}
              isLoading={isLoading}
              error={error}
              getTitle={(conversation) => getConversationTitle(conversation, currentUser)}
              onRetry={retry}
              onSelect={(id) => {
                setSelectedId(id);
                setMobileChatOpen(true);
              }}
            />
          )}
        </aside>

        <section
          aria-label="Selected conversation"
          aria-live="polite"
          className={`h-full min-h-0 min-w-0 flex-col overflow-hidden md:flex ${mobileChatOpen && selectedConversation ? "flex" : "hidden"}`}
        >
          {selectedConversation ? (
            <ChatPanel
              key={selectedConversation.id}
              title={getConversationTitle(selectedConversation, currentUser)}
              conversation={selectedConversation}
              currentUser={currentUser}
              isRealtimeConnected={isRealtimeConnected}
              onMessageSent={refreshConversations}
              onBack={() => setMobileChatOpen(false)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-16">
              <div className="max-w-xs text-center">
                <span
                  aria-hidden="true"
                  className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-900/10"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                  >
                    <path d="M20 11.5a8 8 0 0 1-8 8H4l1.6-3.2A8 8 0 1 1 20 11.5Z" />
                    <path d="M8 10h8M8 13h5" />
                  </svg>
                </span>
                <h2 className="mt-4 text-sm font-semibold text-slate-800">
                  Select a conversation to start chatting.
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Pick a chat from the list, or search for someone to start a new one.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
