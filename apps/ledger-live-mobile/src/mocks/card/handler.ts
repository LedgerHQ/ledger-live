import { http, HttpResponse, passthrough, delay } from "msw";
import {
  isMockCardRequest,
  MOCK_CARD_ACCESS_TOKEN_PREFIX,
} from "@domain/api-card-management/mock/card-session";
import { mockPayCardDetailsToken } from "@domain/api-card-management/mock/card-details-token";
import {
  mockPayCardTransactions,
  readPayCardTransactionsMock,
} from "@domain/api-card-management/mock/card-transactions";
import {
  mockPayCardStatus,
  mockPayCardUser,
  readCardOnboardingStatusMock,
} from "@domain/api-card-management/mock/card-onboarding-status";
import {
  applyPayCardWalletPrioritiesMock,
  mockPayCardLinkedWallets,
  mockPayCardRewardWallet,
  readPayCardReorderMockEnabled,
  readPayCardWalletsMock,
  resolvePayCardInternalWalletsMock,
} from "@domain/api-card-management/mock/card-wallets";
import { createCardMockState } from "./state";

const state = createCardMockState();

const SLOW_MS = 5_000;

/**
 * Long enough for the reordering row to hold its spinner rather than flash it: a mocked write
 * answers within the same frame the drag ends, which a real provider never does.
 */
const REORDER_MS = 200;

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
    access_token: `${MOCK_CARD_ACCESS_TOKEN_PREFIX}${serial}`,
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
      return HttpResponse.json({
        access_token: `${MOCK_CARD_ACCESS_TOKEN_PREFIX}${serial}`,
        expires_in: 3600,
      });

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

/** The order write answers for every session the linked answer itself is mocked for. */
function servesMockedLinkedWallets(request: Request): boolean {
  if (readPayCardWalletsMock() !== undefined || readPayCardReorderMockEnabled()) return true;

  const { walletFunded } = readCardOnboardingStatusMock();
  return walletFunded !== undefined || isMockCardRequest(request);
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

    if (!isMockCardRequest(request)) {
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

    if (!isMockCardRequest(request)) {
      return passthrough();
    }
    return HttpResponse.json(MOCK_CARD_STATUS);
  }),

  http.get("*/v1/card/transactions", ({ request }) => {
    const devtoolTransactions = readPayCardTransactionsMock();
    if (devtoolTransactions !== undefined) {
      return HttpResponse.json(devtoolTransactions);
    }

    return isMockCardRequest(request)
      ? HttpResponse.json(mockPayCardTransactions())
      : passthrough();
  }),

  // The image the token points at is not mocked here: RN loads it through native networking, which
  // these interceptors never see. It stays unread until LWM grows its own reveal UI.
  http.post("*/v1/card/details/token", ({ request }) =>
    isMockCardRequest(request) ? HttpResponse.json(mockPayCardDetailsToken()) : passthrough(),
  ),

  http.get("*/v1/wallet/internal", ({ request }) => {
    const { walletFunded } = readCardOnboardingStatusMock();
    const wallets = resolvePayCardInternalWalletsMock(walletFunded, isMockCardRequest(request));

    return wallets === undefined ? passthrough() : HttpResponse.json(wallets);
  }),

  http.get("*/v1/wallet/internal/card_linked", ({ request }) =>
    servesMockedLinkedWallets(request)
      ? HttpResponse.json(mockPayCardLinkedWallets())
      : passthrough(),
  ),

  http.put("*/v1/wallet/internal/card_linked/priority", async ({ request }) => {
    if (!readPayCardReorderMockEnabled()) {
      return isMockCardRequest(request)
        ? HttpResponse.json({ message: "wallet reorder is not mocked" }, { status: 501 })
        : passthrough();
    }

    const body = (await request
      .clone()
      .json()
      .catch(() => ({}))) as {
      wallets?: readonly { addressId: string; priority: number }[];
    };

    await delay(REORDER_MS);

    // Only the order is written. The balances answered by `/v1/wallet/internal` are left as they
    // are, so the rows the refetch rebuilds keep the amounts they were showing before the drag.
    return HttpResponse.json({
      success: applyPayCardWalletPrioritiesMock({ wallets: [...(body?.wallets ?? [])] }),
    });
  }),

  http.get("*/v1/wallet/reward", ({ request }) =>
    isMockCardRequest(request) ? HttpResponse.json(mockPayCardRewardWallet()) : passthrough(),
  ),
];

export default handlers;
