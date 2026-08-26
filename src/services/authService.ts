import { apiRequest } from "./api";
import { ENDPOINTS } from "./apiConstants";
import type {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
} from "./dto/user.dto";

/** Authentication against the shop backend. */
export const authService = {
  login(credentials: LoginRequestDto): Promise<AuthResponseDto> {
    return apiRequest<AuthResponseDto>(ENDPOINTS.auth.login, {
      method: "POST",
      body: credentials,
    });
  },

  /** Self-registration always creates a customer account. */
  register(registration: RegisterRequestDto): Promise<UserDto> {
    return apiRequest<UserDto>(ENDPOINTS.auth.register, {
      method: "POST",
      body: registration,
    });
  },

  me(): Promise<UserDto> {
    return apiRequest<UserDto>(ENDPOINTS.auth.me, { authenticated: true });
  },
};
