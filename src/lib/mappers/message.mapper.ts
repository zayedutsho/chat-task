import type {
  Message,
  MessageDto,
  MessageHistory,
  MessageHistoryResponseDto,
} from "../../types/message";

export function mapMessage(dto: MessageDto): Message {
  return {
    id: dto._id,
    conversationId: dto.conversation,
    senderId: dto.sender,
    text: dto.text,
    createdAt: dto.createdAt,
  };
}

export function mapMessageHistory(dto: MessageHistoryResponseDto): MessageHistory {
  return {
    // The API returns newest-first; map creates a new array before reversing.
    messages: dto.messages.map(mapMessage).reverse(),
    hasMore: dto.hasMore,
  };
}