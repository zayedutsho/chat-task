"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Avatar from "./Avatar";
import { ArrowLeft } from "lucide-react";
import { getMessages, sendMessage } from "../../lib/api/messages";
import { getChatSocket, mapSocketMessage } from "../../lib/socket";
import type { Conversation } from "../../types/conversation";
import type { Message } from "../../types/message";
import type { User } from "../../types/user";

interface ChatPanelProps {
  title: string;
  conversation: Conversation;
  currentUser: User | null;
  /** Real socket connection state, owned by the chat page. */
  isRealtimeConnected: boolean;
  onMessageSent: () => void;
  onBack: () => void;
}

/** Groups consecutive messages under a day heading using timestamps we already have. */
function formatDayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

interface MessageRow {
  message: Message;
  createdAt: Date;
  hasValidTimestamp: boolean;
  dayLabel: string;
  showDayDivider: boolean;
}

/** Annotates each message with the day heading it introduces, if any. */
function withDayDividers(messages: Message[]): MessageRow[] {
  const rows: MessageRow[] = [];
  let lastDayLabel = "";

  for (const message of messages) {
    const createdAt = new Date(message.createdAt);
    const hasValidTimestamp = !Number.isNaN(createdAt.getTime());
    const dayLabel = hasValidTimestamp ? formatDayLabel(createdAt) : "";
    const showDayDivider = Boolean(dayLabel) && dayLabel !== lastDayLabel;
    if (showDayDivider) lastDayLabel = dayLabel;

    rows.push({ message, createdAt, hasValidTimestamp, dayLabel, showDayDivider });
  }

  return rows;
}

export default function ChatPanel({
  title,
  conversation,
  currentUser,
  isRealtimeConnected,
  onMessageSent,
  onBack,
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
  const otherParticipants = conversation.participants.filter(
    (participant) => participant.id !== currentUser?.id,
  );
  const participantSummary =
    conversation.type === "group"
      ? [currentUser ? "You" : null, ...otherParticipants.map((participant) => participant.name)]
          .filter(Boolean)
          .join(", ")
      : otherParticipants[0]?.phone || "";

  const messageRows = withDayDividers(messages);

  return (
    <>
      <header className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-3 sm:gap-3 sm:px-6 sm:py-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-700 md:hidden"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <Avatar name={title} tone="emerald" />
        <div className="min-w-0 flex-1">
          <h2
            title={title}
            className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg"
          >
            {title}
          </h2>
          {participantSummary && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{participantSummary}</p>
          )}
        </div>
        {isRealtimeConnected ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-emerald-800 uppercase ring-1 ring-inset ring-emerald-900/10">
            <span aria-hidden="true" className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-600" />
            </span>
            Live
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase ring-1 ring-inset ring-slate-900/10">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-slate-300" />
            Offline
          </span>
        )}
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
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-700 sm:px-6 md:px-8"
      >
        {isLoading ? (
          <p role="status" className="py-10 text-center text-sm text-slate-500">
            Loading messages...
          </p>
        ) : error && messages.length === 0 ? (
          <div className="mx-auto max-w-md rounded-xl border border-red-100 bg-red-50 p-4">
            <p role="alert" className="text-sm leading-6 text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={retry}
              disabled={isSending}
              className="mt-3 rounded-lg border border-emerald-200 bg-white px-3.5 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-slate-800">No messages yet</p>
            <p className="mt-1.5 text-sm text-slate-500">
              Messages in this conversation will appear here.
            </p>
          </div>
        ) : (
          <ol className="space-y-3.5">
            {messageRows.map(({ message, createdAt, hasValidTimestamp, dayLabel, showDayDivider }) => {
              const isMine = message.senderId === currentUser?.id;
              const sender = conversation.participants.find(
                (participant) => participant.id === message.senderId,
              );
              const senderName =
                conversation.type === "group" && !isMine ? sender?.name : undefined;

              return (
                <Fragment key={message.id}>
                  {showDayDivider && (
                    <li
                      aria-hidden="true"
                      className="flex items-center gap-3 py-1 font-mono text-[10px] tracking-[0.18em] text-slate-500 uppercase"
                    >
                      <span className="h-px flex-1 bg-slate-100" />
                      {dayLabel}
                      <span className="h-px flex-1 bg-slate-100" />
                    </li>
                  )}
                  <li className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                    {!isMine && <Avatar name={sender?.name || "?"} size="sm" />}
                    <div
                      className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[70%] lg:max-w-[62%] ${
                        isMine
                          ? "rounded-br-sm bg-emerald-800 text-white"
                          : "rounded-bl-sm bg-slate-100 text-slate-900"
                      }`}
                    >
                      {senderName && (
                        <p className="mb-0.5 break-words text-[11px] font-semibold text-emerald-800">
                          {senderName}
                        </p>
                      )}
                      <p className="text-sm leading-6 whitespace-pre-wrap wrap-anywhere">
                        {message.text}
                      </p>
                      <time
                        dateTime={hasValidTimestamp ? message.createdAt : undefined}
                        className={`mt-1 block text-right font-mono text-[10px] ${
                          isMine ? "text-emerald-100" : "text-slate-500"
                        }`}
                      >
                        {hasValidTimestamp
                          ? createdAt.toLocaleTimeString(undefined, {
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "Time unavailable"}
                      </time>
                    </div>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        )}
      </div>
      {error && messages.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5 sm:px-6">
          <p role="alert" className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={retry}
            disabled={isSending}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Retry
          </button>
        </div>
      )}
      {hasNewMessages && (
        <div className="flex shrink-0 justify-center pb-1">
          <button
            type="button"
            onClick={scrollToLatest}
            className="rounded-full bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-950/10 transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            &darr; New messages
          </button>
        </div>
      )}
      <form
        onSubmit={handleSend}
        aria-busy={isSending}
        className="shrink-0 border-t border-slate-100 bg-white px-3 py-3 sm:px-6 sm:py-4"
      >
        <label htmlFor="message-draft" className="sr-only">
          Message
        </label>
        <div className="flex min-w-0 items-end gap-2 sm:gap-3">
          <textarea
            id="message-draft"
            rows={1}
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
            className="block max-h-32 min-h-11 min-w-0 w-full flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base leading-5 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          />
          <button
            type="submit"
            disabled={isSending || isLoading || !draft.trim()}
            className="min-h-11 shrink-0 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 active:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
        {sendError && (
          <p id="send-error" role="alert" className="mt-2 text-sm text-red-700">
            {sendError}
          </p>
        )}
        <p className="mt-2 text-[11px] text-slate-500">Shift+Enter for a new line</p>
      </form>
    </>
  );
}
