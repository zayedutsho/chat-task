/**
 * Static, non-interactive illustration of the chat product for the landing page.
 * It intentionally mirrors the tokens used by the real chat UI (emerald-800 outgoing
 * bubbles, slate-100 incoming bubbles, emerald-50 selected conversation) so the
 * marketing page and the app read as one product. Nothing here is focusable.
 */

type PreviewConversation = {
  id: string;
  kind: "Group" | "Direct";
  title: string;
  preview: string;
  time: string;
  initials: string;
  selected?: boolean;
  online?: boolean;
  unread?: boolean;
  /** Trimmed on small screens so the stacked mock stays a sensible height. */
  compactHidden?: boolean;
};

type PreviewMessage = {
  id: string;
  /** Omitted for the current user's own messages. */
  from?: string;
  initials?: string;
  text: string;
  time: string;
};

const conversations: PreviewConversation[] = [
  {
    id: "ship-room",
    kind: "Group",
    title: "Ship Room",
    preview: "Priya: Reading history now — nothing jumped.",
    time: "9:42 PM",
    initials: "SR",
    selected: true,
  },
  {
    id: "maya",
    kind: "Direct",
    title: "Maya Ortiz",
    preview: "Release notes are in the doc.",
    time: "9:31 PM",
    initials: "MO",
    online: true,
    unread: true,
  },
  {
    id: "design-weekly",
    kind: "Group",
    title: "Design Weekly",
    preview: "Tomas: Moved the review to Thursday.",
    time: "7:15 PM",
    initials: "DW",
    compactHidden: true,
  },
  {
    id: "dad",
    kind: "Direct",
    title: "Dad",
    preview: "Call me when you land.",
    time: "Tue",
    initials: "D",
    compactHidden: true,
  },
];

const messages: PreviewMessage[] = [
  {
    id: "m1",
    from: "Maya Ortiz",
    initials: "MO",
    text: "Are we still shipping tonight?",
    time: "9:38 PM",
  },
  {
    id: "m2",
    text: "Yep — realtime is already live.",
    time: "9:39 PM",
  },
  {
    id: "m3",
    from: "Tomas Lund",
    initials: "TL",
    text: "Just pulled the branch and killed my tunnel halfway through a thread. It reconnected on its own and backfilled everything I missed.",
    time: "9:41 PM",
  },
  {
    id: "m4",
    text: "That's the part I wanted you to try.",
    time: "9:41 PM",
  },
  {
    id: "m5",
    from: "Priya Raman",
    initials: "PR",
    text: "Reading history now — nothing jumped.",
    time: "9:42 PM",
  },
];

function Avatar({ initials, tone }: { initials: string; tone: "emerald" | "slate" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ring-inset ${
        tone === "emerald"
          ? "bg-emerald-100 text-emerald-900 ring-emerald-900/10"
          : "bg-slate-100 text-slate-600 ring-slate-900/10"
      }`}
    >
      {initials}
    </span>
  );
}

export default function ChatPreview() {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_90px_-40px_rgba(16,60,40,0.45)] ring-1 ring-slate-900/5 sm:rounded-3xl">
        <div className="grid md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {/* Conversation sidebar — stacks above the thread on small screens, exactly like the app. */}
          <div className="min-w-0 border-b border-slate-200 md:border-r md:border-b-0">
            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-emerald-800 uppercase">
                  Your chats
                </p>
                <p className="mt-1 truncate text-base font-semibold tracking-tight text-slate-900">
                  Conversations
                </p>
              </div>
              <span
                aria-hidden="true"
                className="shrink-0 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800"
              >
                New group
              </span>
            </div>

            <div
              aria-hidden="true"
              className="mx-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-400 sm:mx-4"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.6-3.6" strokeLinecap="round" />
              </svg>
              Search people
            </div>

            <ul className="space-y-1 p-3 sm:p-4">
              {conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  className={conversation.compactHidden ? "hidden md:block" : undefined}
                >
                  <div
                    className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${
                      conversation.selected
                        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                        : "border-transparent"
                    }`}
                  >
                    <span className="relative shrink-0">
                      <Avatar
                        initials={conversation.initials}
                        tone={conversation.selected ? "emerald" : "slate"}
                      />
                      {conversation.online && (
                        <span
                          aria-hidden="true"
                          className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                        />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-slate-900">
                          {conversation.title}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-slate-500">
                          {conversation.time}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-slate-500">
                          {conversation.kind} &middot; {conversation.preview}
                        </span>
                        {conversation.unread && (
                          <span
                            aria-hidden="true"
                            className="size-1.5 shrink-0 rounded-full bg-emerald-600"
                          />
                        )}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Thread */}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight text-slate-900">
                  Ship Room
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  You, Maya, Tomas, Priya
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-emerald-800 uppercase ring-1 ring-inset ring-emerald-900/10">
                <span aria-hidden="true" className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-600" />
                </span>
                Live
              </span>
            </div>

            <div className="flex-1 space-y-4 bg-white p-4 sm:p-6">
              <p
                aria-hidden="true"
                className="flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-slate-500 uppercase"
              >
                <span className="h-px flex-1 bg-slate-100" />
                Today
                <span className="h-px flex-1 bg-slate-100" />
              </p>

              <ol className="space-y-3.5">
                {messages.map((message) => {
                  const isMine = !message.from;

                  return (
                    <li
                      key={message.id}
                      className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      {!isMine && message.initials && (
                        <Avatar initials={message.initials} tone="slate" />
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[72%] ${
                          isMine
                            ? "rounded-br-sm bg-emerald-800 text-white"
                            : "rounded-bl-sm bg-slate-100 text-slate-900"
                        }`}
                      >
                        {message.from && (
                          <p className="mb-0.5 text-[11px] font-semibold text-emerald-800">
                            {message.from}
                          </p>
                        )}
                        <p className="text-[13px] leading-[1.45] sm:text-sm sm:leading-6">
                          {message.text}
                        </p>
                        <span
                          className={`mt-1 block text-right font-mono text-[10px] ${
                            isMine ? "text-emerald-100" : "text-slate-500"
                          }`}
                        >
                          {message.time}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <p className="flex items-center gap-2 pl-1 text-[11px] text-slate-500">
                <span aria-hidden="true" className="flex items-center gap-1">
                  <span className="size-1.5 animate-pulse rounded-full bg-slate-300 motion-reduce:animate-none" />
                  <span className="size-1.5 animate-pulse rounded-full bg-slate-300 [animation-delay:180ms] motion-reduce:animate-none" />
                  <span className="size-1.5 animate-pulse rounded-full bg-slate-300 [animation-delay:360ms] motion-reduce:animate-none" />
                </span>
                Maya is typing
              </p>
            </div>

            {/* Composer */}
            <div aria-hidden="true" className="border-t border-slate-100 p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-400 sm:text-sm">
                  Write a message&hellip;
                </span>
                <span className="shrink-0 rounded-lg bg-emerald-800 px-3.5 py-2.5 text-[13px] font-semibold text-white sm:px-4">
                  Send
                </span>
              </div>
              <p className="mt-2 hidden text-[11px] text-slate-500 sm:block">
                Shift+Enter for a new line
              </p>
            </div>
          </div>
        </div>
      </div>

      <figcaption className="mt-4 font-mono text-[11px] leading-5 tracking-wide text-slate-500 sm:mt-5">
        A group thread in Cadence. Sender names on incoming group messages, timestamps
        on everything, and a socket that stays open while you read.
      </figcaption>
    </figure>
  );
}
