"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createGroupConversation } from "../../lib/api/conversations";
import { searchUsers } from "../../lib/api/users";
import type { User } from "../../types/user";

interface CreateGroupPanelProps {
  currentUser: User;
  onCreated: () => void;
  onCancel: () => void;
}

export default function CreateGroupPanel({
  currentUser,
  onCreated,
  onCancel,
}: CreateGroupPanelProps) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const creating = useRef(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    let ignore = false;
    const timeout = setTimeout(() => {
      searchUsers(trimmedQuery)
        .then((users) => {
          if (!ignore) {
            setResults(
              Array.from(new Map(users.map((user) => [user.id, user])).values())
                .filter((user) => user.id !== currentUser.id),
            );
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
  }, [query, currentUser.id]);

  function toggleMember(user: User) {
    if (creating.current || user.id === currentUser.id) return;
    setSelectedUsers((selected) =>
      selected.some((member) => member.id === user.id)
        ? selected.filter((member) => member.id !== user.id)
        : [...selected, user],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const members = selectedUsers.filter((user) => user.id !== currentUser.id);
    if (!trimmedName || members.length < 2 || creating.current) return;

    creating.current = true;
    setIsCreating(true);
    setError("");

    try {
      await createGroupConversation({
        name: trimmedName,
        participantIds: members.map((user) => user.id),
      });
      onCreated();
    } catch {
      setError("We couldn't create your group. Please try again.");
    } finally {
      creating.current = false;
      setIsCreating(false);
    }
  }

  return (
    <form
      id="create-group-panel"
      onSubmit={handleSubmit}
      aria-labelledby="create-group-heading"
      aria-busy={isCreating}
      className="border-b border-slate-100 px-5 py-4"
    >
      <fieldset disabled={isCreating} className="min-w-0 space-y-4">
        <h2 id="create-group-heading" className="text-base font-semibold">
          New group
        </h2>
        <div>
          <label htmlFor="group-name" className="block text-sm font-medium text-slate-700">
            Group name
          </label>
          <input
            id="group-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Project Team"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="group-member-search" className="block text-sm font-medium text-slate-700">
            Find members
          </label>
          <input
            id="group-member-search"
            type="search"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              setResults([]);
              setSearchError("");
              setIsSearching(Boolean(value.trim()));
            }}
            placeholder="Search by name or phone"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 disabled:opacity-60"
          />
        </div>

        {query.trim() && (
          <div aria-busy={isSearching}>
            {isSearching ? (
              <p role="status" className="text-sm text-slate-500">Searching...</p>
            ) : searchError ? (
              <p role="alert" className="text-sm text-red-700">{searchError}</p>
            ) : results.length === 0 ? (
              <p role="status" className="text-sm text-slate-500">No matching people found.</p>
            ) : (
              <ul aria-label="Matching members" className="max-h-48 space-y-1 overflow-y-auto">
                {results.map((user) => (
                  <li key={user.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-emerald-50">
                      <input
                        type="checkbox"
                        checked={selectedUsers.some((member) => member.id === user.id)}
                        onChange={() => toggleMember(user)}
                        className="size-4 shrink-0 accent-emerald-800"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{user.name}</span>
                        <span className="block truncate text-xs text-slate-500">{user.phone}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <p id="group-member-hint" className="text-sm text-slate-500">
            Select at least 2 people. {selectedUsers.length} selected.
          </p>
          {selectedUsers.length > 0 && (
            <ul aria-label="Selected members" className="mt-2 flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => toggleMember(user)}
                    aria-label={`Remove ${user.name}`}
                    className="max-w-full rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-900 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-emerald-700"
                  >
                    <span className="break-all">{user.name}</span> <span aria-hidden="true">&times;</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating || !name.trim() || selectedUsers.length < 2}
            aria-describedby="group-member-hint"
            className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Creating..." : "Create group"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
