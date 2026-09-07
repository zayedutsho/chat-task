import type { User, UserDto } from "../../types/user";
import { mapUser } from "../mappers/user.mapper";
import { apiClient } from "./client";

export async function searchUsers(): Promise<User[]> {
  const { data } = await apiClient.get<UserDto[]>("/users/search");
  return data.map(mapUser);
}