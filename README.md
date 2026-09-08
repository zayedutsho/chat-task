# Cadence

A responsive realtime chat application built for a Senior Frontend Engineer take-home assignment, with direct conversations, groups, and scrolling that respects the reader.

## Live Demo

- Landing: `chat-task-eta.vercel.app`
## GitHub

[Repository](https://github.com/zayedutsho/chat-task)

## Features

- Phone/name login with automatic registration and client-side session guards.
- Debounced name/phone search, direct conversations, and group creation.
- All / Direct / Groups filters and conversation previews.
- Message history, sender/receiver bubbles, group sender names, and local timestamps.
- REST sending, Socket.IO updates, and duplicate-message protection.
- Smart auto-scroll with a new-message indicator when reading older history.
- Desktop split view, mobile list/detail navigation, and loading/error/empty states.
- Product landing page, Home navigation, and logout.

## Tech Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Axios, Socket.IO Client, and lucide-react.

TanStack Query is installed but is not used in the application architecture. Fetching and state use React's built-in hooks.

## Getting Started

Requirements: Node.js **20.9 or newer** and npm, plus network access to the hosted backend.

```bash
npm install
```

Copy `.env.example` to `.env.local`, or create `.env.local` in the project root:

```dotenv
NEXT_PUBLIC_API_URL=https://frontend-task-chatapp.onrender.com/api
```

This is public configuration, not a secret. Never add JWTs to environment files or commit `.env.local`. The same URL is the Axios fallback. Next.js embeds public variables at build time; set them before building. Socket.IO currently uses the fixed root origin `https://frontend-task-chatapp.onrender.com` in `src/lib/socket.ts`; there is no separate socket environment variable.

```bash
npm run dev
```

Open `http://localhost:3000`. Enter through `/login`; `/chat` checks for a stored token before mounting chat content.

```bash
npm run lint
npm run build
npm start
```

`npm start` serves the production build. The project has no committed automated test runner; the final review also requires browser testing against the hosted API.

## Project Structure

```text
src/
  app/
    page.tsx                 # Landing page
    login/page.tsx
    chat/page.tsx            # Shared chat state and orchestration
  components/
    auth/AuthGuard.tsx
    chat/                    # List, search, group form, panel, avatar
    landing/                 # Static preview and feature narrative
  lib/
    api/                     # Endpoint services, auth, Axios client
    mappers/                 # DTO-to-domain normalization
    socket.ts                # Shared socket and payload validation
  types/                     # API DTOs and frontend domain models
  providers/                 # Unused starter placeholder
docs/
  API.md
```

## Architecture & Decisions

Request/response flow:

```text
UI -> API service -> shared Axios client -> backend
backend DTO -> mapper -> frontend domain model -> UI
```

DTO/domain separation keeps `_id`, singular/plural participants, and lightweight creation responses at the API boundary. The UI consumes consistent `id` fields and populated user models. Axios centralizes Bearer-token injection and error normalization.

The chat page owns conversation selection, list/search state, and creation orchestration. Focused components receive props and callbacks. `ChatPanel` owns history, drafts, sending, and scrolling. The group form keeps its own draft and member selection. The current scope does not justify global state or a custom fetching framework.

REST supplies initial history and the primary send path. Socket.IO receives realtime updates. Known message payloads are validated, deduplicated by ID, and reconciled with REST; unfamiliar payloads trigger refetching. Request guards prevent stale results from replacing newer state, and socket listeners are cleaned up on unmount.

## Authentication Tradeoff

The backend returns a JWT that REST and Socket.IO both need. `tokenStorage` isolates localStorage access; the mapped current user is also persisted. Browser storage is read after hydration by route checks, and loading placeholders avoid flashing protected content.

`AuthGuard` is a **client-side UX/session guard**, not server-side authentication or HttpOnly-cookie protection. A fake or expired stored token can pass the presence check; the backend remains the authorization boundary and must reject invalid JWTs. An HttpOnly server-managed session/BFF would offer stronger token isolation if the backend architecture allowed it.

Logout clears the stored token/user, disconnects the authenticated socket, and replaces the route with `/login`. Opening `/chat` again reruns the guard.

## Smart Auto-Scroll

- Initial history opens at the latest messages.
- Incoming messages follow when the reader is within 100px of the bottom.
- Scrolling upward preserves the reading position as messages arrive.
- A new-message button returns to the latest; scrolling near the bottom also clears it.
- A successful own send may scroll to the bottom after reconciliation.

## Responsive Design

Desktop retains a sidebar and chat panel. Below `md`, the conversation list appears first; selecting a chat displays its full-screen detail. Back returns to the list without navigation or discarding the mounted history.

The viewport-height shell uses flex/grid layout with fixed-size headers/composer and independently scrolling lists/message areas. Names truncate, message text and URLs wrap, and the composer keeps the Send button visible.

## API Notes

See [standalone API documentation](docs/API.md) for requests, observed response shapes, authentication, socket events, and quirks. Backend inconsistencies are normalized at the service/mapper boundary. The documentation distinguishes confirmed fields from unconfirmed response bodies and reported observations.

## AI Usage

AI tools were used extensively as development accelerators for bounded implementation tasks, visual iteration, debugging, code review, and documentation drafting. Examples include isolated chat features, landing/chat UI refinement, responsive layout review, auth guards, and fixes for observed backend response-shape inconsistencies.

Implementation decisions were checked against supplied API/Swagger details, captured runtime responses, source inspection, production builds, and targeted mocked checks. These checks do not replace a complete live browser acceptance pass; browser automation was unavailable during the final assistant review.

Scope constraints rejected or simplified suggestions involving unnecessary global state, an authentication-library/cookie migration, custom hook frameworks, or replacing the working REST send flow with socket emits. AI assistance is disclosed rather than attributing all code to manual authorship.

## Tradeoffs

- localStorage JWT supports the existing REST/socket backend but has weaker token isolation than an HttpOnly session.
- The client guard improves navigation UX; the server enforces authorization.
- Creation/list payloads differ, so creation explicitly refetches conversations. Group creation does not guess an ID from an undocumented response.
- Local component state avoids additional architecture for this scope.
- REST sending plus socket receiving favors predictable behavior over optimistic messages.
- `hasMore` is preserved in the API model, but older-history pagination UI and query parameters are not implemented.

## If I Had More Time

- Confirm pagination parameters and add infinite history loading.
- Add automated integration/e2e coverage and a broader accessibility audit.
- Introduce stronger server-managed authentication if backend support permits it.
- Improve offline/reconnect UX and add delivery/read receipts with documented backend support.
- Add group administration and selected-conversation deep links.
