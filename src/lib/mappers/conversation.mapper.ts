import type {
  Conversation,
  ConversationDto,
  CreatedConversation,
  CreateConversationResponseDto,
} from "../../types/conversation";
import { mapUser } from "./user.mapper";

export function mapConversation(dto: ConversationDto): Conversation {
  return {
    id: dto._id,
    type: dto.type,
    lastMessage: dto.lastMessage
      ? {
          text: dto.lastMessage.text,
          senderId: dto.lastMessage.sender,
          createdAt: dto.lastMessage.createdAt,
        }
      : undefined,
    updatedAt: dto.updatedAt,
    name: dto.name,
    createdBy: dto.createdBy,
    admins: dto.admins ? [...dto.admins] : undefined,
    participants: dto.participants.map(mapUser),
  };
}

export function mapCreatedConversation(
  dto: CreateConversationResponseDto,
): CreatedConversation {
  return {
    id: dto._id,
    participantIds: [...dto.participants],
    createdAt: dto.createdAt,
  };
}