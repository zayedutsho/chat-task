import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "./api/client";
import { mapMessage } from "./mappers/message.mapper";
import type { Message } from "../types/message";

let socket: Socket | null = null;

export function getChatSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token = tokenStorage.get();
  if (!token) return null;

  if (!socket) {
    socket = io("https://frontend-task-chatapp.onrender.com", {
      autoConnect: false,
      auth: { token },
    });
  } else {
    socket.auth = { token };
  }

  return socket;
}

export function mapSocketMessage(payload: unknown): Message | null {
  // Only the known REST message shape is safe to reuse without socket documentation.
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("_id" in payload) || typeof payload._id !== "string" || !payload._id ||
    !("conversation" in payload) || typeof payload.conversation !== "string" || !payload.conversation ||
    !("sender" in payload) || typeof payload.sender !== "string" || !payload.sender ||
    !("text" in payload) || typeof payload.text !== "string" ||
    !("createdAt" in payload) || typeof payload.createdAt !== "string" ||
    !Number.isFinite(Date.parse(payload.createdAt))
  ) {
    return null;
  }

  return mapMessage({
    _id: payload._id,
    conversation: payload.conversation,
    sender: payload.sender,
    text: payload.text,
    createdAt: payload.createdAt,
  });
}
