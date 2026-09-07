import type { User, UserDto } from "../../types/user";

export function mapUser(dto: UserDto): User {
  return {
    id: dto._id,
    name: dto.name,
    phone: dto.phone,
    createdAt: dto.createdAt,
  };
}