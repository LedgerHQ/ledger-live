import { delay, http, HttpResponse, passthrough } from "msw";
import {
  MOCK_CARD_DETAILS_IMAGE_URL,
  mockCardDetailsImage,
  mockPayCardDetailsToken,
} from "@domain/api-card-management/mock/card-details-token";
import { isMockCardRequest } from "@domain/api-card-management/mock/card-session";
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

const REORDER_MS = 200;
const TRANSACTIONS_PAGE_SIZE = 10;

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

  http.get("*/v1/card/transactions", ({ request }) => {
    const override = readPayCardTransactionsMock();
    if (override === undefined && !isMockCardRequest(request)) return passthrough();

    const transactions = override ?? mockPayCardTransactions();
    const page = Number(new URL(request.url).searchParams.get("page") ?? 0);
    const start = page * TRANSACTIONS_PAGE_SIZE;

    return HttpResponse.json(transactions.slice(start, start + TRANSACTIONS_PAGE_SIZE));
  }),

  http.post("*/v1/card/details/token", ({ request }) =>
    isMockCardRequest(request) ? HttpResponse.json(mockPayCardDetailsToken()) : passthrough(),
  ),

  http.get(MOCK_CARD_DETAILS_IMAGE_URL, () =>
    HttpResponse.text(mockCardDetailsImage(), { headers: { "Content-Type": "image/svg+xml" } }),
  ),

  http.get("*/v1/wallet/internal", ({ request }) => {
    const { walletFunded } = readCardOnboardingStatusMock();
    const wallets = resolvePayCardInternalWalletsMock(walletFunded, isMockCardRequest(request));

    return wallets === undefined ? passthrough() : HttpResponse.json(wallets);
  }),

  http.get("*/v1/wallet/internal/card_linked", ({ request }) => {
    if (readPayCardWalletsMock() !== undefined || readPayCardReorderMockEnabled()) {
      return HttpResponse.json(mockPayCardLinkedWallets());
    }

    const { walletFunded } = readCardOnboardingStatusMock();

    return walletFunded === undefined && !isMockCardRequest(request)
      ? passthrough()
      : HttpResponse.json(mockPayCardLinkedWallets());
  }),

  http.put("*/v1/wallet/internal/card_linked/priority", async ({ request }) => {
    if (!readPayCardReorderMockEnabled()) {
      return isMockCardRequest(request)
        ? HttpResponse.json({ message: "wallet reorder is not mocked" }, { status: 501 })
        : passthrough();
    }

    const body = (await request.json().catch(() => null)) as {
      wallets?: { addressId: string; priority: number }[];
    } | null;

    await delay(REORDER_MS);

    return HttpResponse.json({
      success: applyPayCardWalletPrioritiesMock({ wallets: body?.wallets ?? [] }),
    });
  }),

  http.get("*/v1/wallet/reward", ({ request }) =>
    isMockCardRequest(request) ? HttpResponse.json(mockPayCardRewardWallet()) : passthrough(),
  ),

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
