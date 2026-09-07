"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { getMessages, sendMessage } from "../../lib/api/messages";
import { getChatSocket, mapSocketMessage } from "../../lib/socket";
import type { Conversation } from "../../types/conversation";
import type { Message } from "../../types/message";
import type { User } from "../../types/user";

interface ChatPanelProps {
  title: string;
  conversation: Conversation;
  currentUser: User | null;
  onMessageSent: () => void;
}

export default function ChatPanel({
  title,
  conversation,
  currentUser,
  onMessageSent,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const sendInFlight = useRef(false);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const pendingSocketMessages = useRef(new Map<string, Message>());
  const active = useRef(false);
  const latestRequest = useRef(0);
  const hasLoaded = useRef(false);
  const nearBottom = useRef(true);
  const scrollRequested = useRef(false);
  const forceScroll = useRef(false);

  const updateMessages = useCallback((next: Message[]) => {
    const unique = Array.from(new Map(next.map((message) => [message.id, message])).values())
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    const existingIds = new Set(messagesRef.current.map((message) => message.id));
    const hasNew = unique.some((message) => !existingIds.has(message.id));
    const shouldScroll = !hasLoaded.current || forceScroll.current || (nearBottom.current && hasNew);

    if (shouldScroll) {
      scrollRequested.current = true;
      setHasNewMessages(false);
    } else if (hasNew) {
      setHasNewMessages(true);
    }
    forceScroll.current = false;
    hasLoaded.current = true;
    messagesRef.current = unique;
    setMessages(unique);
  }, []);

  const refreshMessages = useCallback(async (
    failureMessage = "We couldn't load the messages. Please try again.",
  ) => {
    const request = ++latestRequest.current;
    try {
      const history = await getMessages(conversation.id);
      if (!active.current || request !== latestRequest.current) return;

      // Keep genuine socket messages until REST includes them; REST wins for matching IDs.
      const merged = new Map(pendingSocketMessages.current);
      for (const message of history.messages) {
        merged.set(message.id, message);
        pendingSocketMessages.current.delete(message.id);
      }
      updateMessages(Array.from(merged.values()));
      setError("");
    } catch {
      if (active.current && request === latestRequest.current) setError(failureMessage);
    } finally {
      if (active.current && request === latestRequest.current) setIsLoading(false);
    }
  }, [conversation.id, updateMessages]);

  useEffect(() => {
    active.current = true;
    const socket = getChatSocket();

    function onMessage(payload: unknown) {
      const message = mapSocketMessage(payload);
      if (message && message.conversationId !== conversation.id) return;

      if (message) {
        pendingSocketMessages.current.set(message.id, message);
        if (hasLoaded.current) {
          updateMessages([...messagesRef.current, message]);
        }
      }
      void refreshMessages();
    }
    function onConnect() {
      void refreshMessages();
    }

    socket?.on("message:new", onMessage);
    socket?.on("connect", onConnect);
    void refreshMessages();

    return () => {
      active.current = false;
      socket?.off("message:new", onMessage);
      socket?.off("connect", onConnect);
    };
  }, [conversation.id, requestVersion, refreshMessages, updateMessages]);

  useLayoutEffect(() => {
    if (!isLoading && scrollRequested.current && messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
      nearBottom.current = true;
      scrollRequested.current = false;
    }
  }, [messages, isLoading]);

  function scrollToLatest() {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
      nearBottom.current = true;
      setHasNewMessages(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sendInFlight.current || isLoading) return;

    sendInFlight.current = true;
    setIsSending(true);
    setSendError("");

    try {
      await sendMessage({ conversationId: conversation.id, text });
      onMessageSent();
      if (!active.current) return;
      setDraft("");
      forceScroll.current = true;
      await refreshMessages("Your message was sent, but we couldn't refresh the history. Please retry.");
    } catch {
      if (active.current) setSendError("We couldn't send your message. Please try again.");
    } finally {
      sendInFlight.current = false;
      if (active.current) setIsSending(false);
    }
  }

  function retry() {
    setError("");
    if (!hasLoaded.current) setIsLoading(true);
    setRequestVersion((version) => version + 1);
  }
  return (
    <>
      <header className="border-b border-slate-100 px-6 py-6">
        <h2 className="text-lg font-semibold break-words">{title}</h2>
      </header>
      <div
        ref={messageAreaRef}
        onScroll={(event) => {
          const area = event.currentTarget;
          nearBottom.current = area.scrollHeight - area.scrollTop - area.clientHeight <= 100;
          if (nearBottom.current) setHasNewMessages(false);
        }}
        aria-label="Message history"
        aria-busy={isLoading}
        tabIndex={0}
        className="h-[55dvh] overflow-y-auto p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-700 sm:p-6 md:h-[calc(100dvh-20rem)] md:min-h-48"
      >
        {isLoading ? (
          <p role="status" className="py-8 text-center text-sm text-slate-500">
            Loading messages...
          </p>
        ) : error && messages.length === 0 ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={retry}
              disabled={isSending}
              className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-700">No messages yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Messages in this conversation will appear here.
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {messages.map((message) => {
              const isMine = message.senderId === currentUser?.id;
              const senderName =
                conversation.type === "group" && !isMine
                  ? conversation.participants.find(
                      (participant) => participant.id === message.senderId,
                    )?.name
                  : undefined;
              const createdAt = new Date(message.createdAt);
              const hasValidTimestamp = !Number.isNaN(createdAt.getTime());
  
              return (
                <li
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                      isMine
                        ? "rounded-br-sm bg-emerald-800 text-white"
                        : "rounded-bl-sm bg-slate-100 text-slate-900"
                    }`}
                  >
                    {senderName && (
                      <p className="mb-1 text-xs font-semibold text-emerald-800">
                        {senderName}
                      </p>
                    )}
                    <p className="text-sm leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]">
                      {message.text}
                    </p>
                    <time
                      dateTime={hasValidTimestamp ? message.createdAt : undefined}
                      className={`mt-1 block text-right text-xs ${
                        isMine ? "text-emerald-100" : "text-slate-500"
                      }`}
                    >
                      {hasValidTimestamp
                        ? createdAt.toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Time unavailable"}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      {error && messages.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-6 py-2">
          <p role="alert" className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={retry}
            disabled={isSending}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            Retry
          </button>
        </div>
      )}
      {hasNewMessages && (
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={scrollToLatest}
            className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            &darr; New messages
          </button>
        </div>
      )}
      <form
        onSubmit={handleSend}
        aria-busy={isSending}
        className="border-t border-slate-100 p-4 sm:px-6"
      >
        <label htmlFor="message-draft" className="sr-only">
          Message
        </label>
        <textarea
          id="message-draft"
          rows={2}
          value={draft}
          disabled={isSending}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Write a message..."
          aria-describedby={sendError ? "send-error" : undefined}
          className="block w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 disabled:opacity-60"
        />
        {sendError && (
          <p id="send-error" role="alert" className="mt-2 text-sm text-red-700">
            {sendError}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Shift+Enter for a new line</p>
          <button
            type="submit"
            disabled={isSending || isLoading || !draft.trim()}
            className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </>
  );
}
