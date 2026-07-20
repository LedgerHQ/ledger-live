import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  PayCardAuthResponse,
  PayCardLogoutResponse,
  PayCardPreAuthResponse,
  PayCardUserResponse,
} from "./types";

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

type PayCardApiMockHandler = (request: FetchArgs) => unknown;

export const payCardApiMockDatabase: Readonly<
  Record<string, PayCardApiMockHandler>
> = {
  "POST /card/v1/pre-auth": (): PayCardPreAuthResponse => ({
    login_url: "https://card.withcl.com/",
  }),
  "POST /card/v1/auth": (): PayCardAuthResponse => ({
    app_session_token: "cs_mock_card_session_token",
    expires_at: new Date(Date.now() + SEVEN_DAYS_IN_MS).toISOString(),
  }),
  "GET /card/v1/me": (): PayCardUserResponse => ({
    provider_user_id: "mock_provider_user",
    verification_state: "VERIFIED",
    phase: null,
  }),
  "POST /card/v1/logout": (): PayCardLogoutResponse => ({
    success: true,
  }),
};

function getPathname(url: string): string {
  return new URL(url, "https://card-mock.invalid").pathname;
}

export function getPayCardApiMockHandler(
  request: FetchArgs,
): PayCardApiMockHandler | undefined {
  const method = (request.method ?? "GET").toUpperCase();
  return payCardApiMockDatabase[`${method} ${getPathname(request.url)}`];
}
