"use client";

import { useEffect, useState } from "react";
import { getMessages } from "../../lib/api/messages";
import type { Conversation } from "../../types/conversation";
import type { Message } from "../../types/message";
import type { User } from "../../types/user";

interface ChatPanelProps {
  title: string;
  conversation: Conversation;
  currentUser: User | null;
}

export default function ChatPanel({
  title,
  conversation,
  currentUser,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let ignore = false;

    getMessages(conversation.id)
      .then((history) => {
        if (!ignore) setMessages(history.messages);
      })
      .catch(() => {
        if (!ignore) {
          setError("We couldn't load the messages. Please try again.");
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [conversation.id, requestVersion]);

  function retry() {
    setError("");
    setIsLoading(true);
    setRequestVersion((version) => version + 1);
  }

  return (
    <>
      <header className="border-b border-slate-100 px-6 py-6">
        <h2 className="text-lg font-semibold break-words">{title}</h2>
      </header>
      <div
        aria-label="Message history"
        aria-busy={isLoading}
        tabIndex={0}
        className="h-[55dvh] overflow-y-auto p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-700 sm:p-6 md:h-[calc(100dvh-9rem)]"
      >
        {isLoading ? (
          <p role="status" className="py-8 text-center text-sm text-slate-500">
            Loading messages...
          </p>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p role="alert" className="text-sm text-red-700">
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
    </>
  );
}
