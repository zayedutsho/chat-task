"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { login } from "../../lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    setError("");

    const input = { name: name.trim(), phone: phone.trim() };
    if (!input.name || !input.phone) {
      setError("Please enter your name and phone number.");
      return;
    }

    setIsLoading(true);

    try {
      await login(input);
      router.replace("/chat");
    } catch {
      setError("We couldn't sign you in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f5f7f5] bg-[radial-gradient(ellipse_at_top,#e6efe9,transparent_65%)] px-5 py-12 text-slate-900 selection:bg-emerald-100">
      <section
        aria-labelledby="login-heading"
        className="w-full max-w-[440px] rounded-3xl border border-white bg-white p-7 shadow-[0_16px_64px_-24px_rgba(20,50,35,0.18)] ring-1 ring-slate-900/5 sm:p-10"
      >
        <div
          aria-hidden="true"
          className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-900/5"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
          >
            <path d="M20 11.5a8 8 0 0 1-8 8H4l1.6-3.2A8 8 0 1 1 20 11.5Z" />
            <path d="M8 10h8M8 13h5" />
          </svg>
        </div>

        <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-emerald-800 uppercase">
          A little closer
        </p>
        <h1
          id="login-heading"
          className="text-3xl font-semibold tracking-tight sm:text-[2rem]"
        >
          Sign in to chat
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
          Enter your name and phone number to get started.
        </p>

        <form
          onSubmit={handleSubmit}
          aria-busy={isLoading}
          className="mt-8 space-y-6"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              disabled={isLoading}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-base outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-slate-700"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              disabled={isLoading}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Your phone number"
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-base outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800 active:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
