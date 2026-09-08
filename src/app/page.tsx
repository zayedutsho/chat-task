import type { Metadata } from "next";
import Link from "next/link";
import ChatPreview from "../components/landing/ChatPreview";
import FeatureStory from "../components/landing/FeatureStory";

export const metadata: Metadata = {
  title: "Cadence — conversation without the reload",
  description:
    "Cadence is a realtime messaging app for direct threads and group rooms. Messages land the moment they are sent, and the thread never drags you away from what you are reading.",
};

/** Paper-grain overlay. Inline SVG turbulence keeps this CSS-only — no image assets. */
const noise =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

const specs = [
  { label: "Transport", value: "Socket.IO, always open" },
  { label: "Surfaces", value: "Direct threads + groups" },
  { label: "Reading", value: "Your scroll is never hijacked" },
];

function LiveDot() {
  return (
    <span aria-hidden="true" className="relative flex size-1.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:animate-none" />
      <span className="relative inline-flex size-1.5 rounded-full bg-emerald-600" />
    </span>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-900/10"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[18px]"
        >
          <path d="M20 11.5a8 8 0 0 1-8 8H4l1.6-3.2A8 8 0 1 1 20 11.5Z" />
          <path d="M8 10h8M8 13h5" />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
        Cadence
      </span>
    </span>
  );
}

export default function Home() {
  return (
    <div className="relative isolate min-h-dvh bg-[#f6f8f6] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-950">
      {/* Decorative backdrop: green wash, faded grid, paper grain. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-15%,#dcece2,transparent_70%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] [background-size:76px_76px] [mask-image:radial-gradient(ellipse_75%_45%_at_50%_0%,black,transparent_80%)]" />
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
          style={{ backgroundImage: noise }}
        />
      </div>

      <header className="sticky top-0 z-20 border-b border-slate-900/5 bg-[#f6f8f6]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 sm:py-4">
          <div className="flex items-center gap-4">
            <Wordmark />
            <span
              aria-hidden="true"
              className="hidden h-4 w-px bg-slate-900/10 sm:block"
            />
            <p className="hidden items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-emerald-800 uppercase sm:flex">
              <LiveDot />
              Realtime
            </p>
          </div>

          <Link
            href="/login"
            className="group flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-slate-900 ring-1 ring-slate-900/10 transition-colors hover:text-emerald-900 hover:ring-emerald-700/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:text-sm"
          >
            Open chat
            <span
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            >
              &rarr;
            </span>
          </Link>
        </div>
      </header>

      <main className="relative">
        {/* ---------------------------------------------------------------- Hero */}
        <section
          aria-labelledby="hero-heading"
          className="mx-auto max-w-6xl px-5 pt-14 pb-10 sm:px-8 sm:pt-20 md:pt-28 md:pb-14"
        >
          <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-emerald-800 uppercase">
            Direct &middot; Groups &middot; Realtime
          </p>

          <h1
            id="hero-heading"
            className="mt-6 max-w-4xl text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-6xl md:text-7xl lg:text-[5.5rem] lg:leading-[0.95]"
          >
            Nobody should have to{" "}
            <span className="font-mono text-[0.8em] tracking-tight text-emerald-800 line-through decoration-emerald-700/40 decoration-[0.12em]">
              refresh
            </span>{" "}
            to hear you.
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:mt-8 sm:text-lg sm:leading-8">
            One-to-one threads and group rooms in the same window. Messages land the
            moment they are sent. And when you scroll up to re-read something, nothing
            yanks you back to the bottom.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/login"
              className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800 active:bg-emerald-950 sm:text-base"
            >
              Start chatting
            </Link>
            <a
              href="#product"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-6 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-700/30 hover:bg-white hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 sm:text-base"
            >
              See it in action
              <span aria-hidden="true">&darr;</span>
            </a>
          </div>

          <p className="mt-5 text-[13px] text-slate-500">
            A name and a phone number. That is the whole sign-up.
          </p>

          {/* Spec strip — an editorial fact row instead of a feature-card grid. */}
          <dl className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-900/10 sm:mt-16 sm:grid-cols-3">
            {specs.map((spec) => (
              <div key={spec.label} className="bg-[#f6f8f6] px-5 py-4">
                <dt className="font-mono text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  {spec.label}
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ------------------------------------------------- Product as the hero */}
        <section
          id="product"
          aria-labelledby="product-heading"
          className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-16 sm:px-8 sm:pb-24"
        >
          <div className="flex flex-col gap-3 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:pb-10">
            <h2
              id="product-heading"
              className="max-w-xl text-2xl font-semibold tracking-[-0.03em] text-balance sm:text-3xl md:text-4xl"
            >
              This is the whole thing. No tour required.
            </h2>
            <p className="max-w-xs text-sm leading-6 text-slate-500 sm:text-right">
              Sidebar, thread, composer. Everything you see below is what you get after
              signing in.
            </p>
          </div>

          <ChatPreview />
        </section>

        {/* ------------------------------------------------------ Feature story */}
        <section
          aria-labelledby="features-heading"
          className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24"
        >
          <div className="pb-2 sm:pb-6">
            <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-emerald-800 uppercase">
              Why it feels different
            </p>
            <h2
              id="features-heading"
              className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl md:text-5xl"
            >
              Three things we got stubborn about.
            </h2>
          </div>

          <FeatureStory />
        </section>

        {/* ---------------------------------------------------------- Final CTA */}
        <section
          aria-labelledby="cta-heading"
          className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24"
        >
          <div className="relative isolate overflow-hidden rounded-3xl bg-emerald-950 px-6 py-14 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent_75%)]"
            />

            <p className="relative flex items-center justify-center gap-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-emerald-300 uppercase">
              <span aria-hidden="true" className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              Socket open
            </p>

            <h2
              id="cta-heading"
              className="relative mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-balance text-white sm:text-5xl md:text-6xl md:leading-[1.03]"
            >
              Say the thing. They will have it before you put the phone down.
            </h2>

            <p className="relative mx-auto mt-6 max-w-md text-base leading-7 text-emerald-100/80">
              Sign in with your name and phone number, find someone, start talking.
            </p>

            <Link
              href="/login"
              className="relative mt-9 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-7 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 sm:text-base"
            >
              Start chatting
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-slate-900/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Wordmark />
          <p className="font-mono text-[11px] tracking-wide text-slate-500">
            Realtime messaging, built with Next.js and Socket.IO.
          </p>
          <Link
            href="/login"
            className="rounded-lg text-[13px] font-semibold text-emerald-800 underline decoration-emerald-700/30 underline-offset-4 transition-colors hover:text-emerald-900 hover:decoration-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
