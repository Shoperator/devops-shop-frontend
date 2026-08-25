export type UserRole = "ADMIN" | "CUSTOMER";

/** Mirrors `UserResponseDto` on the backend. */
export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  walletAddress: string | null;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface RegisterRequestDto {
  username: string;
  displayName: string;
  password: string;
  walletAddress?: string;
}

export interface AuthResponseDto {
  accessToken: string;
  tokenType: string;
  user: UserDto;
}

export interface UpdateUserDto {
  displayName?: string;
  walletAddress?: string;
}
