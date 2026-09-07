export interface MessageDto {
  _id: string;
  conversation: string;
  sender: string;
  text: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface MessageHistoryResponseDto {
  messages: MessageDto[];
  hasMore: boolean;
}

export interface MessageHistory {
  messages: Message[];
  hasMore: boolean;
}

export interface SendMessageRequestDto {
  conversationId: string;
  text: string;
}