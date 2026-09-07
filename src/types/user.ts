export interface UserDto {
  _id: string;
  name: string;
  phone: string;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  createdAt?: string;
}

export interface LoginRequestDto {
  phone: string;
  name: string;
}

export interface LoginResponseDto {
  token: string;
  user: UserDto & { createdAt: string };
}

export interface AuthSession {
  token: string;
  user: User;
}