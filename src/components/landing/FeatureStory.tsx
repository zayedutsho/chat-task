/**
 * Three editorial feature rows with alternating layout and small CSS-only diagrams.
 * Deliberately not a card grid — each row gets room to make one argument.
 */

function RealtimeDiagram() {
  return (
    <div aria-hidden="true" className="space-y-2.5">
      <div className="h-2.5 w-3/5 rounded-full bg-slate-200/90" />
      <div className="ml-auto h-2.5 w-2/5 rounded-full bg-emerald-800/20" />
      <div className="h-2.5 w-1/2 rounded-full bg-slate-200/90" />
      <div className="flex items-center gap-2.5 pt-1">
        <div className="h-2.5 w-2/3 rounded-full bg-emerald-700" />
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
        </span>
      </div>
      <p className="pt-2 font-mono text-[10px] tracking-[0.16em] text-emerald-800 uppercase">
        Delivered 0.0s ago
      </p>
    </div>
  );
}

function GroupsDiagram() {
  return (
    <div aria-hidden="true">
      <div className="flex -space-x-2.5">
        {["MO", "TL", "PR", "JK", "+4"].map((initials, index) => (
          <span
            key={initials}
            className={`flex size-9 items-center justify-center rounded-full text-[11px] font-semibold ring-2 ring-white ${
              index === 4
                ? "bg-emerald-800 text-white"
                : "bg-emerald-100 text-emerald-900"
            }`}
          >
            {initials}
          </span>
        ))}
      </div>
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <span className="font-mono text-[10px] tracking-[0.14em] text-emerald-800 uppercase">
            Group
          </span>
          <span className="h-1.5 flex-1 rounded-full bg-emerald-800/20" />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <span className="font-mono text-[10px] tracking-[0.14em] text-slate-500 uppercase">
            Direct
          </span>
          <span className="h-1.5 flex-1 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function ScrollDiagram() {
  return (
    <div aria-hidden="true">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="space-y-2 p-3">
          <div className="h-2 w-1/2 rounded-full bg-slate-200" />
          <div className="ml-auto h-2 w-1/3 rounded-full bg-slate-200" />
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1.5 ring-1 ring-inset ring-emerald-200">
            <span className="h-2 w-2/3 rounded-full bg-emerald-800/30" />
            <span className="font-mono text-[9px] tracking-[0.14em] text-emerald-800 uppercase">
              Here
            </span>
          </div>
          <div className="h-2 w-2/5 rounded-full bg-slate-200/70" />
          <div className="ml-auto h-2 w-1/2 rounded-full bg-slate-200/70" />
        </div>
        <div className="flex justify-center pb-3">
          <span className="rounded-full bg-emerald-800 px-3 py-1.5 text-[11px] font-semibold text-white">
            &darr; New messages
          </span>
        </div>
      </div>
      <p className="mt-3 font-mono text-[10px] tracking-[0.16em] text-slate-500 uppercase">
        Position held
      </p>
    </div>
  );
}

const features = [
  {
    index: "01",
    label: "Realtime",
    heading: "Messages land. Nothing reloads.",
    body: "A socket stays open the whole time you have the thread in front of you, so a message sent on the other side of the world shows up in yours. No polling, no pull-to-refresh, no stale window you have to trust.",
    diagram: <RealtimeDiagram />,
  },
  {
    index: "02",
    label: "Groups",
    heading: "One window, every room.",
    body: "A group of nine and a one-to-one thread are the same object here: same composer, same history, same delivery path. Group messages just carry the sender's name, so a fast conversation never turns into guesswork about who said what.",
    diagram: <GroupsDiagram />,
  },
  {
    index: "03",
    label: "Your scroll, your place",
    heading: "Scroll up. Stay up.",
    body: "Sitting at the bottom of the thread? New messages follow you down. Scrolled up to re-read something from an hour ago? The view holds still and quietly tells you there is something new. Reading is never interrupted by arriving.",
    diagram: <ScrollDiagram />,
  },
];

export default function FeatureStory() {
  return (
    <>
      {features.map((feature, position) => {
        const isReversed = position % 2 === 1;

        return (
          <article
            key={feature.index}
            className="grid items-center gap-8 border-t border-slate-900/10 py-12 md:grid-cols-2 md:gap-16 md:py-20"
          >
            <div className={isReversed ? "md:order-2" : undefined}>
              <p className="flex items-baseline gap-3">
                <span className="font-mono text-3xl font-semibold tracking-tight text-emerald-800/30 sm:text-4xl">
                  {feature.index}
                </span>
                <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-emerald-800 uppercase">
                  {feature.label}
                </span>
              </p>
              <h3 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.025em] text-balance text-slate-900 sm:text-4xl md:text-[2.75rem] md:leading-[1.05]">
                {feature.heading}
              </h3>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                {feature.body}
              </p>
            </div>

            <div className={isReversed ? "md:order-1" : undefined}>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-[0_16px_50px_-32px_rgba(16,60,40,0.5)] sm:rounded-3xl sm:p-8">
                {feature.diagram}
              </div>
            </div>
          </article>
        );
      })}
    </>
  );
}
