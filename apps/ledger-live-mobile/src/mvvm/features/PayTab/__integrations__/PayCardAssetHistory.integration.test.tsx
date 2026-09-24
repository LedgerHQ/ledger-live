import { screen } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import {
  mockPayCardStatus,
  mockPayCardUser,
} from "@domain/api-card-management/mock/card-onboarding-status";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import {
  mockPayCardInternalWallets,
  mockPayCardLinkedWallets,
  mockPayCardRewardWallet,
} from "@domain/api-card-management/mock/card-wallets";
import { renderPayTabWithCardApi } from "./shared";

const linkedWallets = mockPayCardLinkedWallets().slice(0, 2);
const internalWallets = mockPayCardInternalWallets(true).slice(0, 2);

describe("Pay Card asset history integration", () => {
  beforeEach(() => {
    server.use(
      http.get(/\/v1\/card\/status$/, () => HttpResponse.json(mockPayCardStatus())),
      http.get(/\/v1\/user$/, () => HttpResponse.json(mockPayCardUser(true))),
      http.get(/\/v1\/card\/transactions$/, () => HttpResponse.json(mockPayCardTransactions())),
      http.get(/\/v1\/wallet\/reward$/, () => HttpResponse.json(mockPayCardRewardWallet())),
      http.get(/\/v1\/wallet\/internal$/, () => HttpResponse.json(internalWallets)),
      http.get(/\/v1\/wallet\/internal\/card_linked$/, () => HttpResponse.json(linkedWallets)),
    );
  });

  it("should show the selected asset history and return to its details when navigating back", async () => {
    const { user } = renderPayTabWithCardApi();

    await user.press(await screen.findByLabelText("Details"));
    expect(await screen.findByText("125.40 USDC")).toBeVisible();
    const bitcoinBalance = screen.getByText("0.00432100 BTC");
    expect(bitcoinBalance).toBeVisible();

    await user.press(bitcoinBalance);
    await user.press(await screen.findByText("Transactions"));

    expect(await screen.findByTestId("card-history-asset-scope")).toBeVisible();
    expect(await screen.findByText("STARBUCKS")).toBeVisible();
    expect(screen.queryByText("NETFLIX.COM")).not.toBeOnTheScreen();

    await user.press(screen.getByTestId("navigation-header-back-button"));

    expect(screen.queryByTestId("card-history-asset-scope")).not.toBeOnTheScreen();
    expect(await screen.findByLabelText("Details")).toBeVisible();
  });
});
