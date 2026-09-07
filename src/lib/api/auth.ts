import type { AuthSession, LoginRequestDto, LoginResponseDto } from "../../types/user";
import { mapUser } from "../mappers/user.mapper";
import { apiClient, tokenStorage } from "./client";

export async function login(input: LoginRequestDto): Promise<AuthSession> {
  const { data } = await apiClient.post<LoginResponseDto>("/auth/login", input);
  const session = { token: data.token, user: mapUser(data.user) };
  tokenStorage.set(session.token);
  return session;
}

export function logout(): void {
  tokenStorage.clear();
}