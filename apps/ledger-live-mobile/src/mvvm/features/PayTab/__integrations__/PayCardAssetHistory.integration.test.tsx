import { screen, within } from "@tests/test-renderer";
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
    expect(
      await screen.findByTestId("card-asset-11111111-1111-4111-8111-111111111111"),
    ).toBeVisible();
    const bitcoinAsset = screen.getByTestId("card-asset-22222222-2222-4222-8222-222222222222");
    expect(bitcoinAsset).toBeVisible();

    await user.press(bitcoinAsset);
    await user.press(await screen.findByText("Transactions"));

    expect(await screen.findByTestId("card-history-asset-scope")).toBeVisible();
    expect(await screen.findByText("STARBUCKS")).toBeVisible();
    expect(screen.queryByText("NETFLIX.COM")).not.toBeOnTheScreen();

    await user.press(screen.getByTestId("navigation-header-back-button"));

    expect(screen.queryByTestId("card-history-asset-scope")).not.toBeOnTheScreen();
    const returnedBitcoinAsset = await screen.findByTestId(
      "card-asset-22222222-2222-4222-8222-222222222222",
    );
    expect(within(returnedBitcoinAsset).getByText("Bitcoin")).toBeVisible();
    expect(within(returnedBitcoinAsset).getByText("BTC")).toBeVisible();
    expect(await screen.findByText("NETFLIX.COM")).toBeVisible();
  });
});
