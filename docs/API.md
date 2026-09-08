# Chat API Documentation

This document describes the contracts used by the frontend. Examples use placeholder IDs and synthetic values. Observed quirks are not guarantees about future backend behavior.

## Base URLs

- REST: `https://frontend-task-chatapp.onrender.com/api`
- Socket.IO: `https://frontend-task-chatapp.onrender.com`

REST uses `/api`. Socket.IO connects to the root server origin, not the REST path. `NEXT_PUBLIC_API_URL` configures the Axios base URL; the socket origin is currently fixed in `src/lib/socket.ts`.

## Authentication

### POST /auth/login

Logs in or automatically registers a new phone number.

```json
{
  "phone": "01700000000",
  "name": "Zayed"
}
```

Observed response:

```json
{
  "token": "<JWT>",
  "user": {
    "_id": "<user-id>",
    "name": "Zayed",
    "phone": "01700000000",
    "createdAt": "2026-09-08T10:00:00.000Z"
  }
}
```

All remaining REST endpoints in this document require:

```http
Authorization: Bearer <token>
```

Observed missing-token error:

```json
{
  "error": {
    "message": "No token provided",
    "code": "NO_TOKEN"
  }
}
```

The shared Axios client adds the token from `tokenStorage`. Login persists the mapped user alongside the token; logout clears both locally. The client guard checks token presence, not token validity. Backend JWT validation remains authoritative.

## Users

### GET /users/search?q=<term>

Searches by name or phone. `q` is the query parameter used by the frontend; the service trims it and sends it through Axios `params`. The UI waits 300ms after typing, skips empty queries, and excludes the current user.

Observed response:

```json
[
  { "_id": "<user-id>", "name": "Ada", "phone": "+15551234567" }
]
```

## Conversations

### GET /conversations

Returns a `data` array. Observed direct conversation example:

```json
{
  "data": [
    {
      "_id": "<conversation-id>",
      "type": "direct",
      "lastMessage": {},
      "updatedAt": "2026-09-08T10:00:00.000Z",
      "participant": {
        "_id": "<other-user-id>",
        "name": "Ada",
        "phone": "+15551234567"
      }
    }
  ]
}
```

**API quirks:** direct conversations can contain singular `participant` instead of `participants`. The mapper accepts either and exposes `participants: User[]`. It preserves populated users and skips string IDs, nulls, or incomplete users rather than inventing names. An unresolved direct-chat title falls back to `Direct conversation`.

The list contract also supports `type: "group"`, a `participants` array, and optional `name`, `createdBy`, and `admins`. A populated `lastMessage` contains `text`, `sender`, and `createdAt`; `{}` or incomplete last-message metadata becomes `undefined` in the frontend. `type` and `updatedAt` remain required in the list DTO.

### POST /conversations

Creates a direct conversation.

```json
{ "userId": "<other-user-id>" }
```

Observed lightweight response:

```json
{
  "_id": "<conversation-id>",
  "participants": ["<creator-id>", "<other-user-id>"],
  "createdAt": "2026-09-08T10:00:00.000Z"
}
```

This has a separate creation DTO: participant IDs are not populated users. The UI refetches `GET /conversations` and selects the returned ID only when it appears in the refreshed list.

### POST /conversations/group

Creates a group.

```json
{
  "name": "Project Team",
  "participantIds": ["<user-id-1>", "<user-id-2>"]
}
```

According to the documented backend behavior, the creator is added as a member and admin. The frontend requires a trimmed non-empty name and at least two other users, yielding at least three members. It excludes the creator from `participantIds`.

The successful response body is **unconfirmed**. `createGroupConversation()` returns `Promise<void>` and ignores that body. The UI explicitly refreshes the conversation list after success and does not guess the new group ID.

## Messages

### GET /conversations/{conversationId}/messages

Observed response:

```json
{
  "messages": [
    {
      "_id": "<message-id>",
      "conversation": "<conversation-id>",
      "sender": "<user-id>",
      "text": "Hello",
      "createdAt": "2026-09-08T10:00:00.000Z"
    }
  ],
  "hasMore": false
}
```

The backend returns messages **newest-first**. The mapper maps into a new array and reverses that array for chronological, oldest-first rendering; it does not mutate the API array.

`hasMore` indicates that additional history is available. Exact pagination request parameters were not confirmed or relied upon by this implementation. No undocumented pagination parameters or load-older UI are added.

### POST /messages

```json
{
  "conversationId": "<conversation-id>",
  "text": "Hello"
}
```

The frontend trims text and prevents empty messages and duplicate submissions. The successful response shape is not relied upon: `sendMessage()` returns `Promise<void>`. After success, the frontend clears the draft and refetches/reconciles authoritative history. A failed POST preserves the draft.

Reported observations from backend testing, not guaranteed status contracts:

- An invalid/non-ObjectId conversation ID produced HTTP 500 with a Mongoose cast/server error rather than a cleaner 400-level validation response.
- Accessing or sending in a conversation where the user is not a participant is rejected by the backend. No specific status code is assumed here.

## Errors

Errors generally use `{ "error": { "message": "...", "code": "..." } }`. Axios failures become `ApiError` instances with `message`, `code`, and optional HTTP `status`. Missing backend details fall back to Axios or generic error information. UI components show friendly retry messages. Development diagnostics avoid logging authorization headers or JWTs.

## Socket.IO

```ts
const socket = io("https://frontend-task-chatapp.onrender.com", {
  auth: { token },
});
```

The JWT is passed in the handshake `auth` object. The implementation creates a shared socket lazily in the browser with `autoConnect: false`; the chat page connects it and disconnects on unmount/logout. Component listeners are removed with their original callback references.

| Direction | Event | Contract / use |
| --- | --- | --- |
| Client to server | `message:send` | Documented payload: `{ conversationId, text }`. **Not emitted by this frontend.** |
| Server to client | `message:new` | New-message notification/update; exact payload schema is not formally confirmed. |
| Server to client | `conversation:updated` | Conversation/group changes; refreshes the sidebar. |

REST `POST /messages` is the primary send path, keeping creation behavior predictable. Socket.IO provides realtime receiving and synchronization. The frontend also handles `connect`, `connect_error`, and `disconnect`; reconnecting refreshes the current history and list.

`message:new` is mapped only when it contains the known REST message fields with valid IDs, strings, and a parseable timestamp. Unknown or incomplete payloads trigger a selected-chat REST refetch. Valid events for other chats refresh the sidebar without changing the selected history. Message IDs prevent duplicates; REST fields win for matching IDs. Genuine socket messages are retained until REST includes them. No IDs, users, or timestamps are fabricated.

## API Quirks / Workarounds

| Issue | Observed behavior | Frontend workaround |
| --- | --- | --- |
| Direct participant shape | `participant` versus `participants` | Normalize both into a populated-user array. |
| Empty last message | `lastMessage: {}` | Treat as `undefined`. |
| Creation versus list shape | Lightweight participant IDs versus populated data | Separate DTO; refetch `GET /conversations`. |
| Message ordering | Newest-first | Reverse the newly mapped array for UI rendering. |
| Invalid conversation ID | HTTP 500 / Mongoose cast error reported | Normalize/surface failure without assuming a validation status. |
| Pagination | `hasMore` exists; request parameters unconfirmed | No invented pagination parameters. |
| Group/send success bodies | Undocumented | Ignore body and refresh REST data. |
| Socket payload | Exact schema unconfirmed | Validate known fields or refetch; deduplicate by real ID. |
