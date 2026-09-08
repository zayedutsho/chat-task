"use client";

import Avatar from "./Avatar";
import type { User } from "../../types/user";

interface UserSearchProps {
  searchQuery: string;
  searchResults: User[];
  isSearching: boolean;
  searchError: string;
  creatingUserId: string | null;
  createError: string;
  isConversationLoading: boolean;
  onQueryChange: (query: string) => void;
  onStartConversation: (user: User) => void;
}

export default function UserSearch({
  searchQuery,
  searchResults,
  isSearching,
  searchError,
  creatingUserId,
  createError,
  isConversationLoading,
  onQueryChange,
  onStartConversation,
}: UserSearchProps) {
  return (
    <>
      <div className="shrink-0 px-4 pb-3">
        <label htmlFor="user-search" className="sr-only">
          Find someone
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="size-4"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.6-3.6" />
            </svg>
          </span>
          <input
            id="user-search"
            type="search"
            value={searchQuery}
            disabled={creatingUserId !== null}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by name or phone"
            className="block h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-9 text-base outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-700 focus:bg-white focus:ring-4 focus:ring-emerald-700/10 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          />
        </div>
        {createError && (
          <p role="alert" className="mt-2.5 text-sm text-red-700">
            {createError}
          </p>
        )}
      </div>

      {searchQuery.trim() ? (
        <div
          aria-busy={isSearching || creatingUserId !== null}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3"
        >
          {isSearching ? (
            <p role="status" className="px-2 py-4 text-sm text-slate-500">
              Searching...
            </p>
          ) : searchError ? (
            <p role="alert" className="px-2 py-4 text-sm text-red-700">
              {searchError}
            </p>
          ) : searchResults.length === 0 ? (
            <p role="status" className="px-2 py-4 text-sm text-slate-500">
              No matching people found.
            </p>
          ) : (
            <ul
              aria-label="Search results"
              className="min-h-0 flex-1 space-y-0.5 overflow-y-auto"
            >
              {searchResults.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => onStartConversation(user)}
                    disabled={creatingUserId !== null || isConversationLoading}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Avatar name={user.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {user.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {user.phone}
                      </span>
                      {creatingUserId === user.id && (
                        <span
                          role="status"
                          className="mt-1 block font-mono text-[10px] tracking-[0.12em] text-emerald-800 uppercase"
                        >
                          Starting conversation...
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </>
  );
}
