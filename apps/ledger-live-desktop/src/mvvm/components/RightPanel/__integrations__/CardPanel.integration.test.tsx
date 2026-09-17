import React from "react";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { mockPayCardRewardWallet } from "@domain/api-card-management/mock/card-wallets";
import { getEnv } from "@shared/env";
import { http, HttpResponse, server } from "tests/server";
import { fireEvent, render, screen, within } from "tests/testSetup";
import { Card } from "../Card";

const CARD_TRANSACTIONS_URL = `${getEnv("CARD_BAANX_API_URL")}/v1/card/transactions`;
const CARD_REWARD_WALLET_URL = `${getEnv("CARD_BAANX_API_URL")}/v1/wallet/reward`;

const [subscription] = mockPayCardTransactions();

const signedIn = { payCardAuth: { hasCard: true, status: "signedIn" as const } };

const onTransactionsRequest = jest.fn();

describe("RightPanel card integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(
      http.get(CARD_TRANSACTIONS_URL, () => {
        onTransactionsRequest();
        return HttpResponse.json([subscription]);
      }),
    );
  });

  it("should render the card history inside the scrollable panel once signed in", async () => {
    render(<Card />, { initialState: signedIn });

    const item = await screen.findByTestId(`card-transactions-item-${subscription.id}`);

    expect(screen.getByText("Transactions")).toBeVisible();
    expect(within(item).getByText("NETFLIX.COM")).toBeVisible();
    expect(within(item).getByText("Subscriptions")).toBeInTheDocument();

    const panel = screen.getByRole("region", { name: "Crypto card" });
    expect(panel).toContainElement(item);
    expect(panel.parentElement).toHaveClass("overflow-y-auto");
  });

  it("should format the transaction amounts with the Desktop formatter", async () => {
    render(<Card />, { initialState: signedIn });

    const item = await screen.findByTestId(`card-transactions-item-${subscription.id}`);

    // The euro sign is what proves the view model's formatter reached the list: without it the flow
    // falls back to a bare "12.99 EUR".
    expect(within(item).getByText(/12\.99/)).toHaveTextContent("€");
    expect(within(item).getByText(/13\.0214/)).toHaveTextContent("USDC");
  });

  it("should format the reward balance with the Desktop formatter", async () => {
    server.use(
      http.get(CARD_REWARD_WALLET_URL, () =>
        HttpResponse.json({ ...mockPayCardRewardWallet(), balance: "1234.56" }),
      ),
    );

    render(<Card />, { initialState: signedIn });

    const reward = await screen.findByTestId("card-details-reward");

    expect(within(reward).getByText(/1,234\.56/)).toHaveTextContent("USDC");
  });

  it("should format the transaction date with the Desktop locale", async () => {
    render(<Card />, { initialState: { ...signedIn, settings: { locale: "en-GB" } } });

    const item = await screen.findByTestId(`card-transactions-item-${subscription.id}`);

    expect(within(item).getByText("14 Oct 2024")).toBeVisible();
  });

  it("should open the transaction detail dialog from a history row", async () => {
    render(<Card />, { initialState: signedIn });

    fireEvent.click(await screen.findByTestId(`card-transactions-item-${subscription.id}`));

    const dialog = screen.getByTestId("card-transaction-detail-dialog");
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText("NETFLIX.COM")).toBeVisible();
    expect(within(dialog).getByText("Confirmed")).toBeVisible();
    expect(within(dialog).getByText("***9189")).toBeVisible();
    expect(within(dialog).getByText(subscription.transactionId)).toBeVisible();
    expect(within(dialog).getByText(/12\.99/)).toHaveTextContent("€");
  });

  it("should not ask for the history while the card session is unresolved", async () => {
    render(<Card />);

    expect(await screen.findByTestId("card-artwork")).toBeVisible();
    expect(screen.queryByTestId("card-transactions")).not.toBeInTheDocument();
    expect(onTransactionsRequest).not.toHaveBeenCalled();
  });
});
