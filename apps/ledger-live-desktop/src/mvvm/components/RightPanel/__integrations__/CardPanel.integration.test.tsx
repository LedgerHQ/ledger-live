import React from "react";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { mockPayCardRewardWallet } from "@domain/api-card-management/mock/card-wallets";
import { getEnv } from "@shared/env";
import { http, HttpResponse, server } from "tests/server";
import { fireEvent, render, screen, within } from "tests/testSetup";
import { initialCountervaluesMock } from "tests/mocks/countervalues.mock";
import { Card } from "../Card";

const CARD_TRANSACTIONS_URL = `${getEnv("CARD_BAANX_API_URL")}/v1/card/transactions`;
const CARD_REWARD_WALLET_URL = `${getEnv("CARD_BAANX_API_URL")}/v1/wallet/reward`;
const CAL_TOKENS_URL = `${getEnv("CAL_SERVICE_URL")}/v1/tokens`;
const USDC_ID = "ethereum/erc20/usd__coin";

/** What CAL answers for the reward's token. Without it nothing resolves, so nothing prices. */
const usdcToken = {
  id: USDC_ID,
  contract_address: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48",
  standard: "erc20",
  decimals: 6,
  delisted: false,
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
};

function answerRewardWallet(balance: string) {
  server.use(
    http.get(CARD_REWARD_WALLET_URL, () =>
      HttpResponse.json({ ...mockPayCardRewardWallet(), balance }),
    ),
  );
}

function resolveUsdc() {
  server.use(
    http.get(CAL_TOKENS_URL, ({ request }) => {
      const id = new URL(request.url).searchParams.get("id");
      return HttpResponse.json(id === USDC_ID ? [usdcToken] : []);
    }),
  );
}

const [subscription] = mockPayCardTransactions();

const signedIn = {
  payCardAuth: { hasCard: true, pendingLoginType: null, status: "signedIn" as const },
};

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
    expect(within(panel).getByText("Disclaimer placeholder")).toBeVisible();
  });

  it("should format the transaction amounts with the Desktop formatter", async () => {
    render(<Card />, { initialState: signedIn });

    const item = await screen.findByTestId(`card-transactions-item-${subscription.id}`);

    // The euro sign is what proves the view model's formatter reached the list: without it the flow
    // falls back to a bare "12.99 EUR".
    expect(within(item).getByText(/12\.99/)).toHaveTextContent("€");
    expect(within(item).getByText(/13\.0214/)).toHaveTextContent("USDC");
  });

  it("should show what the reward is worth once its currency and rate resolve", async () => {
    answerRewardWallet("1234.56");
    resolveUsdc();

    render(<Card />, { initialState: signedIn, initialCountervalues: initialCountervaluesMock });

    const reward = await screen.findByTestId("card-details-reward");

    // The seeded rate is 0.9999 USD, so 1234.56 USDC is a little under the balance itself. The
    // dollar sign is what proves the host's counter-value formatter reached the banner.
    expect(await within(reward).findByText(/1,234\.4/)).toHaveTextContent("$");
  });

  it("should format the reward balance with the Desktop formatter while nothing prices it", async () => {
    // No CAL answer, so the token never resolves and the banner falls back to the asset amount.
    answerRewardWallet("1234.56");

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
