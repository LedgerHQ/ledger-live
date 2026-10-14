import { screen } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import {
  mockPayCardStatus,
  mockPayCardUser,
} from "@domain/api-card-management/mock/card-onboarding-status";
import { mockPayCardCashback } from "@domain/api-card-management/mock/card-cashback";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import {
  mockPayCardInternalWallets,
  mockPayCardLinkedWallets,
} from "@domain/api-card-management/mock/card-wallets";
import { renderPayTabWithCardApi } from "./shared";

const WALLETS_BEFORE_LINK = 2;
const SOLANA_BALANCE = "12.500000000 SOL";

function serveCardWallets(count: number) {
  server.use(
    http.get(/\/v1\/wallet\/internal$/, () =>
      HttpResponse.json(mockPayCardInternalWallets(true).slice(0, count)),
    ),
    http.get(/\/v1\/wallet\/internal\/card_linked$/, () =>
      HttpResponse.json(mockPayCardLinkedWallets().slice(0, count)),
    ),
  );
}

describe("Pay Card assets refresh integration", () => {
  beforeEach(() => {
    server.use(
      http.get(/\/v1\/card\/status$/, () => HttpResponse.json(mockPayCardStatus())),
      http.get(/\/v1\/user$/, () => HttpResponse.json(mockPayCardUser(true))),
      http.get(/\/v1\/card\/transactions$/, () => HttpResponse.json(mockPayCardTransactions())),
      http.get(/\/v1\/card\/cashback$/, () => HttpResponse.json(mockPayCardCashback())),
    );
    serveCardWallets(WALLETS_BEFORE_LINK);
  });

  it("should list a wallet linked on the Baanx add-asset page once the secure browser closes", async () => {
    serveCardWallets(0);
    const { user } = renderPayTabWithCardApi();

    await user.press(await screen.findByLabelText("Details"));
    const addAssetButton = await screen.findByTestId("card-assets-empty-state-cta");

    serveCardWallets(1);
    await user.press(addAssetButton);

    expect(await screen.findByText("125.40 USDC")).toBeVisible();
  });

  it("should list a wallet linked while the user was on another screen once Pay is back in focus", async () => {
    const { user } = renderPayTabWithCardApi();

    await user.press(await screen.findByLabelText("Details"));
    await user.press(await screen.findByText("0.00432100 BTC"));
    await user.press(await screen.findByText("Transactions"));
    expect(await screen.findByTestId("card-history-asset-scope")).toBeVisible();

    serveCardWallets(WALLETS_BEFORE_LINK + 1);
    await user.press(screen.getByTestId("navigation-header-back-button"));
    await user.press(await screen.findByLabelText("Details"));

    expect(await screen.findByText(SOLANA_BALANCE)).toBeVisible();
  });
});
