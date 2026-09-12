import { http, HttpResponse, passthrough, delay } from "msw";
import { getMockCardOnboardingStatus } from "@domain/api-card-management/mock";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import {
  mockPayCardInternalWallets,
  mockPayCardLinkedWallets,
  mockPayCardStatus,
  mockPayCardUser,
  readCardOnboardingStatusMock,
} from "@domain/api-card-management/mock/card-onboarding-status";
import { createCardMockState } from "./state";

const state = createCardMockState();

const SLOW_MS = 5_000;

const MOCK_TOKEN_PREFIX = "at_mock_";

const MOCK_DETAILS_IMAGE_URL =
  "https://dummyimage.com/640x195/1f1f1f/ffffff.png&text=****+****+****+1234";

function usesMockToken(request: Request): boolean {
  return request.headers.get("authorization")?.includes(MOCK_TOKEN_PREFIX) ?? false;
}

const MOCK_USER = {
  id: "6f1c9a52-3d4e-4b7a-9c81-2f0d5e7a1b34",
  verificationState: "VERIFIED",
};

const MOCK_CARD_STATUS = {
  id: "000000000050277836",
  holderName: "JOHN DOE",
  expiryDate: "2028/01",
  panLast4: "1234",
  status: "ACTIVE",
  type: "VIRTUAL",
  orderedAt: "2023-03-27T17:07:12.662Z",
};

function rotatedSession(serial: number) {
  return HttpResponse.json({
    access_token: `${MOCK_TOKEN_PREFIX}${serial}`,
    refresh_token: `rt_mock_${serial}`,
    expires_in: 3600,
  });
}

const OAUTH_ERROR_BODY = {
  error: "invalid_grant",
  error_description: "The refresh token is invalid, expired or revoked",
};

async function answerTokenRequest(id: string, serial: number) {
  switch (id) {
    case "200":
      return rotatedSession(serial);

    case "200-slow":
      await delay(SLOW_MS);
      return rotatedSession(serial);

    case "200-bad-body":
      return HttpResponse.json({ access_token: `${MOCK_TOKEN_PREFIX}${serial}`, expires_in: 3600 });

    case "400":
      return HttpResponse.json(OAUTH_ERROR_BODY, { status: 400 });

    case "422":
      return HttpResponse.json({ message: "x field is not allowed" }, { status: 422 });

    case "498":
      return HttpResponse.json({ message: "Invalid client key" }, { status: 498 });

    case "499":
      return HttpResponse.json({ message: "Missing client key" }, { status: 499 });

    case "500":
      return HttpResponse.json({ message: "Internal server error" }, { status: 500 });

    case "network-error":
      return HttpResponse.error();

    default:
      return passthrough();
  }
}

const handlers = [
  http.post("*/v1/auth/oauth2/token", async ({ request }) => {
    const body = (await request
      .clone()
      .json()
      .catch(() => ({}))) as { grant_type?: string };

    if (body.grant_type !== "refresh_token") {
      return passthrough();
    }

    if (state.tokenResponse === "pass") {
      return passthrough();
    }

    state.refreshCount += 1;

    return answerTokenRequest(state.tokenResponse, state.refreshCount);
  }),

  http.get("*/v1/user", ({ request }) => {
    if (state.userUnauthorizedOnce) {
      state.userUnauthorizedOnce = false;
      return HttpResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    // Set by the card onboarding screen, and unset until a step is toggled there.
    const { accountVerified } = readCardOnboardingStatusMock();
    if (accountVerified !== undefined) {
      return HttpResponse.json(mockPayCardUser(accountVerified));
    }

    if (!usesMockToken(request)) {
      return passthrough();
    }

    return HttpResponse.json(MOCK_USER);
  }),

  http.get("*/v1/card/status", ({ request }) => {
    const { hasCard } = readCardOnboardingStatusMock();
    if (hasCard !== undefined) {
      // No card is an absent one, not an empty one: the step reads "has the provider answered with
      // a card at all", and a 404 is how it answers that it has not.
      return hasCard
        ? HttpResponse.json(mockPayCardStatus())
        : HttpResponse.json({ message: "No card ordered" }, { status: 404 });
    }

    if (!usesMockToken(request)) {
      return passthrough();
    }
    return HttpResponse.json(MOCK_CARD_STATUS);
  }),

  http.get("*/v1/card/onboarding-status", () => {
    return HttpResponse.json(getMockCardOnboardingStatus());
  }),
  http.get("*/v1/card/transactions", () => HttpResponse.json(mockPayCardTransactions())),
  http.get("*/v1/wallet/internal", ({ request }) => {
    const { walletFunded } = readCardOnboardingStatusMock();
    if (walletFunded !== undefined) {
      return HttpResponse.json(mockPayCardInternalWallets(walletFunded));
    }

    // A mock session has no provider behind it, so answer as an empty wallet rather than send a
    // mock bearer token to Baanx and collect a 401.
    return usesMockToken(request)
      ? HttpResponse.json(mockPayCardInternalWallets(false))
      : passthrough();
  }),

  http.get("*/v1/wallet/internal/card_linked", ({ request }) => {
    const { walletFunded } = readCardOnboardingStatusMock();

    return walletFunded === undefined && !usesMockToken(request)
      ? passthrough()
      : HttpResponse.json(mockPayCardLinkedWallets());
  }),

  http.post("*/v1/card/details/token", () => {
    return HttpResponse.json({
      token: "00000000-0000-4000-8000-000000000000",
      imageUrl: MOCK_DETAILS_IMAGE_URL,
    });
  }),
];

export default handlers;
