"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../../lib/api/auth";
import type { User } from "../../types/user";
import { searchUsers } from "../../lib/api/users";
import { createConversation, getConversations } from "../../lib/api/conversations";
import type { Conversation } from "../../types/conversation";
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
          {!searchQuery.trim() && (
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
