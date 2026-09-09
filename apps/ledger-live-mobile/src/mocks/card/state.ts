export type CardTokenResponseId =
  | "pass"
  | "200"
  | "200-slow"
  | "200-bad-body"
  | "400"
  | "422"
  | "498"
  | "499"
  | "500"
  | "network-error";

export type CardTokenResponse = {
  readonly id: CardTokenResponseId;
  readonly label: string;
  readonly hint: string;
};

function response(id: CardTokenResponseId, label: string, hint: string): CardTokenResponse {
  return { id, label, hint };
}

export const CARD_TOKEN_RESPONSES: readonly CardTokenResponse[] = [
  response("pass", "Off", "The mock stands aside. The real provider answers the renewal."),
  response(
    "200",
    "200",
    "Token exchange successful. A new access token and a new refresh token. The one answer that keeps the session.",
  ),
  response(
    "200-slow",
    "200 slow",
    "The same body, 5 s later. Holds one renewal open so every waiting caller must share it.",
  ),
  response(
    "200-bad-body",
    "200 bad body",
    "200 with no refresh_token. The wire schema rejects it, so no session is stored, so the session ends.",
  ),
  response(
    "400",
    "400",
    "OAuth 2.0 error (RFC 6749): invalid_grant. A refresh token the provider will not accept again.",
  ),
  response(
    "422",
    "422",
    "Data validation error. Our request was wrong, and the session ends all the same.",
  ),
  response(
    "498",
    "498",
    "Invalid x-client-key header. A build fault, and the session ends all the same.",
  ),
  response(
    "499",
    "499",
    "Missing x-client-key header. A build fault, and the session ends all the same.",
  ),
  response(
    "500",
    "500",
    "Internal server error. A Baanx outage signs the user out. That is the accepted trade.",
  ),
  response(
    "network-error",
    "Network fail",
    "No answer at all. The client cannot know whether Baanx consumed the token, and ends the session.",
  ),
];

export type CardMockState = {
  tokenResponse: CardTokenResponseId;
  readonly responses: readonly CardTokenResponse[];
  userUnauthorizedOnce: boolean;
  refreshCount: number;
};

type MockHost = { payCardMockState?: CardMockState };

export function readCardMockState(): CardMockState | undefined {
  return (globalThis as MockHost).payCardMockState;
}

export function createCardMockState(): CardMockState {
  const state: CardMockState = {
    tokenResponse: "pass",
    responses: CARD_TOKEN_RESPONSES,
    userUnauthorizedOnce: false,
    refreshCount: 0,
  };
  (globalThis as MockHost).payCardMockState = state;
  return state;
}
