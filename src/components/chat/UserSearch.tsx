"use client";

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
      <div className="border-b border-slate-100 px-5 py-4">
        <label htmlFor="user-search" className="block text-sm font-medium text-slate-700">
          Find someone
        </label>
        <input
          id="user-search"
          type="search"
          value={searchQuery}
          disabled={creatingUserId !== null}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by name or phone"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 disabled:opacity-60"
        />
        {createError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {createError}
          </p>
        )}
      </div>

      {searchQuery.trim() ? (
        <div aria-busy={isSearching || creatingUserId !== null} className="p-3">
          {isSearching ? (
            <p role="status" className="px-3 py-4 text-sm text-slate-500">
              Searching...
            </p>
          ) : searchError ? (
            <p role="alert" className="px-3 py-4 text-sm text-red-700">
              {searchError}
            </p>
          ) : searchResults.length === 0 ? (
            <p role="status" className="px-3 py-4 text-sm text-slate-500">
              No matching people found.
            </p>
          ) : (
            <ul aria-label="Search results" className="max-h-[45dvh] space-y-1 overflow-y-auto">
              {searchResults.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => onStartConversation(user)}
                    disabled={creatingUserId !== null || isConversationLoading}
                    className="w-full rounded-xl px-4 py-3 text-left hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="block truncate text-sm font-semibold">{user.name}</span>
                    <span className="mt-1 block truncate text-sm text-slate-500">{user.phone}</span>
                    {creatingUserId === user.id && (
                      <span role="status" className="mt-1 block text-xs text-emerald-800">
                        Starting conversation...
                      </span>
                    )}
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
