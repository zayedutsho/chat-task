import type { User, UserDto } from "../../types/user";
import { mapUser } from "../mappers/user.mapper";
import { apiClient } from "./client";

export async function searchUsers(query: string): Promise<User[]> {
  const { data } = await apiClient.get<UserDto[]>("/users/search", {
    params: { q: query.trim() },
  });
  return data.map(mapUser);
}
