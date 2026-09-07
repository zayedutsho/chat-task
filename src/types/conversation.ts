import type { User, UserDto } from "./user";

export interface ConversationDto {
  _id: string;
  type: "direct" | "group";
  lastMessage?: { text?: string; sender?: string; createdAt?: string };
  updatedAt: string;
  name?: string;
  createdBy?: string;
  admins?: string[];
  participant?: UserDto | string | null;
  participants?: (UserDto | string | null)[];
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  lastMessage?: { text: string; senderId: string; createdAt: string };
  updatedAt: string;
  name?: string;
  createdBy?: string;
  admins?: string[];
  participants: User[];
}

export interface ConversationsResponseDto {
  data: ConversationDto[];
}

export interface CreateConversationRequestDto {
  userId: string;
}

export interface CreateConversationResponseDto {
  _id: string;
  participants: string[];
  createdAt: string;
}

export interface CreatedConversation {
  id: string;
  participantIds: string[];
  createdAt: string;
}
export interface CreateGroupRequestDto {
  name: string;
  participantIds: string[];
}