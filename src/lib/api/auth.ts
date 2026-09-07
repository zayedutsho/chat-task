import type { AuthSession, LoginRequestDto, LoginResponseDto, User } from "../../types/user";
import { ApiError } from "../../types/api";
import { mapUser } from "../mappers/user.mapper";
import { apiClient, tokenStorage } from "./client";

const USER_KEY = "chat-app.current-user";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(USER_KEY);
    if (!stored) return null;

    const user: unknown = JSON.parse(stored);
    if (
      typeof user !== "object" ||
      user === null ||
      !("id" in user) ||
      typeof user.id !== "string" ||
      !user.id ||
      !("name" in user) ||
      typeof user.name !== "string" ||
      !("phone" in user) ||
      typeof user.phone !== "string" ||
      ("createdAt" in user && typeof user.createdAt !== "string")
    ) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      ...("createdAt" in user ? { createdAt: user.createdAt as string } : {}),
    };
  } catch {
    return null;
  }
}

function storeCurrentUser(user: User | null): void {
  if (typeof window === "undefined") return;

  try {
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_KEY);
    }
  } catch {
    throw new ApiError("Unable to update stored user.", "USER_STORAGE_ERROR");
  }
}

export async function login(input: LoginRequestDto): Promise<AuthSession> {
  const { data } = await apiClient.post<LoginResponseDto>("/auth/login", input);
  const session = { token: data.token, user: mapUser(data.user) };
  tokenStorage.set(session.token);
  try {
    storeCurrentUser(session.user);
  } catch (error) {
    tokenStorage.clear();
    throw error;
  }
  return session;
}

export function logout(): void {
  try {
    tokenStorage.clear();
  } finally {
    storeCurrentUser(null);
  }
}
