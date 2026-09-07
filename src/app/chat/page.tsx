"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser } from "../../lib/api/auth";
import type { User } from "../../types/user";
import { getChatSocket } from "../../lib/socket";
import { searchUsers } from "../../lib/api/users";
import { createConversation, getConversations } from "../../lib/api/conversations";
import type { Conversation } from "../../types/conversation";
import CreateGroupPanel from "../../components/chat/CreateGroupPanel";
import ChatPanel from "../../components/chat/ChatPanel";
import ConversationList from "../../components/chat/ConversationList";
import UserSearch from "../../components/chat/UserSearch";

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
  const [isGroupOpen, setIsGroupOpen] = useState(false);
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
      refreshConversations();
    }
    function onConnectError() {
      if (process.env.NODE_ENV === "development") console.warn("Chat socket connection failed.");
    }
    function onDisconnect() {
      if (process.env.NODE_ENV === "development") console.info("Chat socket disconnected.");
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
            <button
              type="button"
              onClick={() => setIsGroupOpen(true)}
              disabled={isGroupOpen || !currentUser || creatingUserId !== null}
              aria-expanded={isGroupOpen}
              aria-controls={isGroupOpen ? "create-group-panel" : undefined}
              className="mt-4 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60"
            >
              New group
            </button>
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
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              isLoading={isLoading}
              error={error}
              getTitle={(conversation) => getConversationTitle(conversation, currentUser)}
              onRetry={retry}
              onSelect={setSelectedId}
            />
          )}
        </aside>

        <section
          aria-label="Selected conversation"
          aria-live="polite"
          className="min-h-48 min-w-0"
        >
          {selectedConversation ? (
            <ChatPanel
              key={selectedConversation.id}
              title={getConversationTitle(selectedConversation, currentUser)}
              conversation={selectedConversation}
              currentUser={currentUser}
              onMessageSent={refreshConversations}
            />
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
