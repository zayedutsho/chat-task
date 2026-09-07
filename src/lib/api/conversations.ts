import type {
  Conversation,
  ConversationsResponseDto,
  CreatedConversation,
  CreateConversationRequestDto,
  CreateConversationResponseDto,
} from "../../types/conversation";
import { mapConversation, mapCreatedConversation } from "../mappers/conversation.mapper";
import { apiClient } from "./client";

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await apiClient.get<ConversationsResponseDto>("/conversations");
  return data.data.map(mapConversation);
}

export async function createConversation(
  input: CreateConversationRequestDto,
): Promise<CreatedConversation> {
  const { data } = await apiClient.post<CreateConversationResponseDto>(
    "/conversations",
    input,
  );
  return mapCreatedConversation(data);
}