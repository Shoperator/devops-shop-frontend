import type {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
} from "./dto/user.dto";
import { notImplemented } from "./notImplemented";

/**
 * Authentication against the shop backend. The HTTP calls are added together
 * with the login screen in a follow-up commit; for now this file only pins down
 * the surface the UI will talk to.
 */
export const authService = {
  login(credentials: LoginRequestDto): Promise<AuthResponseDto> {
    return notImplemented("authService.login", credentials.username);
  },

  register(registration: RegisterRequestDto): Promise<UserDto> {
    return notImplemented("authService.register", registration.username);
  },

  me(): Promise<UserDto> {
    return notImplemented("authService.me");
  },
};
