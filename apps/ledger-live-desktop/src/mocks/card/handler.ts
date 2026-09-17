import { http, HttpResponse, passthrough } from "msw";
import {
  MOCK_CARD_DETAILS_IMAGE_URL,
  mockCardDetailsImage,
  mockPayCardDetailsToken,
} from "@domain/api-card-management/mock/card-details-token";
import { isMockCardRequest } from "@domain/api-card-management/mock/card-session";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import {
  mockPayCardStatus,
  mockPayCardUser,
  readCardOnboardingStatusMock,
} from "@domain/api-card-management/mock/card-onboarding-status";
import {
  mockPayCardInternalWallets,
  mockPayCardLinkedWallets,
} from "@domain/api-card-management/mock/card-wallets";

const handlers = [
  http.get("*/v1/user", ({ request }) => {
    const { accountVerified } = readCardOnboardingStatusMock();
    if (accountVerified !== undefined) {
      return HttpResponse.json(mockPayCardUser(accountVerified));
    }

    return isMockCardRequest(request) ? HttpResponse.json(mockPayCardUser(true)) : passthrough();
  }),

  http.get("*/v1/card/status", ({ request }) => {
    const { hasCard } = readCardOnboardingStatusMock();
    if (hasCard !== undefined) {
      return hasCard
        ? HttpResponse.json(mockPayCardStatus())
        : HttpResponse.json({ message: "No card ordered" }, { status: 404 });
    }

    return isMockCardRequest(request) ? HttpResponse.json(mockPayCardStatus()) : passthrough();
  }),

  http.get("*/v1/card/transactions", ({ request }) =>
    isMockCardRequest(request) ? HttpResponse.json(mockPayCardTransactions()) : passthrough(),
  ),

  http.post("*/v1/card/details/token", ({ request }) =>
    isMockCardRequest(request) ? HttpResponse.json(mockPayCardDetailsToken()) : passthrough(),
  ),

  http.get(MOCK_CARD_DETAILS_IMAGE_URL, () =>
    HttpResponse.text(mockCardDetailsImage(), { headers: { "Content-Type": "image/svg+xml" } }),
  ),

  http.get("*/v1/wallet/internal", ({ request }) => {
    const { walletFunded } = readCardOnboardingStatusMock();
    if (walletFunded !== undefined) {
      return HttpResponse.json(mockPayCardInternalWallets(walletFunded));
    }

    return isMockCardRequest(request)
      ? HttpResponse.json(mockPayCardInternalWallets(false))
      : passthrough();
  }),

  http.get("*/v1/wallet/internal/card_linked", ({ request }) => {
    const { walletFunded } = readCardOnboardingStatusMock();

    return walletFunded === undefined && !isMockCardRequest(request)
      ? passthrough()
      : HttpResponse.json(mockPayCardLinkedWallets());
  }),

  // Never let a fake bearer reach an unmocked provider endpoint.
  http.all("*/v1/*", ({ request }) =>
    isMockCardRequest(request)
      ? HttpResponse.json(
          { message: `${new URL(request.url).pathname} is not mocked` },
          { status: 501 },
        )
      : passthrough(),
  ),
];

export default handlers;
