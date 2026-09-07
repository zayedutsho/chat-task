import type {
  MessageHistory,
  MessageHistoryResponseDto,
  SendMessageRequestDto,
} from "../../types/message";
import { mapMessageHistory } from "../mappers/message.mapper";
import { apiClient } from "./client";

export async function getMessages(conversationId: string): Promise<MessageHistory> {
  const { data } = await apiClient.get<MessageHistoryResponseDto>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
  return mapMessageHistory(data);
}

export async function sendMessage(input: SendMessageRequestDto): Promise<void> {
  // The send endpoint's response shape is not documented.
  await apiClient.post<unknown>("/messages", input);
}