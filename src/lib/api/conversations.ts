import type {
  Conversation,
  ConversationsResponseDto,
  CreatedConversation,
  CreateConversationRequestDto,
  CreateConversationResponseDto,
  CreateGroupRequestDto,
} from "../../types/conversation";
import { mapConversation, mapCreatedConversation } from "../mappers/conversation.mapper";
import { ApiError } from "../../types/api";
import { apiClient, normalizeApiError } from "./client";

export async function getConversations(): Promise<Conversation[]> {
  try {
    const { data } = await apiClient.get<ConversationsResponseDto>("/conversations");
    if (!Array.isArray(data?.data)) {
      throw new ApiError(
        "Unexpected conversations response: expected a data array.",
        "INVALID_CONVERSATIONS_RESPONSE",
      );
    }
    return data.data.map(mapConversation);
  } catch (error) {
    const normalized = normalizeApiError(error);
    if (process.env.NODE_ENV === "development") {
      // Log only error details, never Axios request headers containing the token.
      console.error("Unable to load conversations.", {
        message: normalized.message,
        code: normalized.code,
        status: normalized.status,
      });
    }
    throw normalized;
  }
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

export async function createGroupConversation(input: CreateGroupRequestDto): Promise<void> {
  // The success response is undocumented; the list endpoint supplies full conversations.
  await apiClient.post<unknown>("/conversations/group", input);
}