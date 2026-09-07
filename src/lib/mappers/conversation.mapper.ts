import type {
  Conversation,
  ConversationDto,
  CreatedConversation,
  CreateConversationResponseDto,
} from "../../types/conversation";
import type { UserDto } from "../../types/user";
import { mapUser } from "./user.mapper";

export function mapConversation(dto: ConversationDto): Conversation {
  // Direct chats may return one participant; group chats use the array shape.
  const participants = Array.isArray(dto.participants)
    ? dto.participants
    : dto.participant
      ? [dto.participant]
      : [];
  const populatedParticipants = participants.filter(
    (participant): participant is UserDto =>
      typeof participant === "object" &&
      participant !== null &&
      typeof participant._id === "string" &&
      typeof participant.name === "string" &&
      typeof participant.phone === "string",
  );

  if (
    process.env.NODE_ENV === "development" &&
    (participants.length === 0 || populatedParticipants.length !== participants.length)
  ) {
    console.warn("Conversation participants are not fully populated.", {
      id: dto._id,
      participant: dto.participant,
      participants: dto.participants,
    });
  }

  return {
    id: dto._id,
    type: dto.type,
    lastMessage:
      typeof dto.lastMessage?.text === "string" &&
      typeof dto.lastMessage.sender === "string" &&
      typeof dto.lastMessage.createdAt === "string"
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
    participants: populatedParticipants.map(mapUser),
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