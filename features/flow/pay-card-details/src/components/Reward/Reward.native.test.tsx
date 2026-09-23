import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { mockPayCardRewardWallet } from "@domain/api-card-management/mock/card-wallets";
import { CARD_REWARD_WALLET_URL, listenToCardApi } from "@support/msw-features-flow-pay-card";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { cardApiWrapper } from "../../__tests__/cardApiStore";
import { CARD_COPY } from "../../__tests__/i18nWrapper";
import { Reward } from "./Reward";
import type { RewardProps } from "./types";

const server = listenToCardApi();

/** The Ledger id the api resolves the reward's `usdc` to. */
const USDC_LEDGER_ID = "ethereum/erc20/usd__coin";

const USDC = { id: USDC_LEDGER_ID, ticker: "USDC" } as unknown as CryptoOrTokenCurrency;

/** Pricing as the host hands it over: the resolved currencies, a rate, and a formatter. */
const pricing: RewardProps = {
  currencies: new Map([[USDC_LEDGER_ID, USDC]]),
  getCounterValue: () => 1032,
  formatCountervalue: (value: number) => `$${(value / 100).toFixed(2)}`,
};

describe("Reward (native)", () => {
  it("renders nothing while nobody is signed in", () => {
    server.use(
      http.get(CARD_REWARD_WALLET_URL, () => HttpResponse.json(mockPayCardRewardWallet())),
    );

    render(<Reward />, { wrapper: cardApiWrapper({ signedIn: false }) });

    expect(screen.queryByTestId("card-details-reward")).toBeNull();
  });

  it("renders the reward card once the wallet arrives", async () => {
    server.use(
      http.get(CARD_REWARD_WALLET_URL, () => HttpResponse.json(mockPayCardRewardWallet())),
    );

    render(<Reward />, { wrapper: cardApiWrapper({ signedIn: true }) });

    await waitFor(() => expect(screen.getByTestId("card-details-reward")).toBeVisible());
    expect(screen.getByText("10.32 USDC")).toBeVisible();
    expect(screen.getByText(CARD_COPY.reward)).toBeVisible();
  });

  it("leads with the counter-value once the host can price the reward", async () => {
    server.use(
      http.get(CARD_REWARD_WALLET_URL, () => HttpResponse.json(mockPayCardRewardWallet())),
    );

    render(<Reward {...pricing} />, { wrapper: cardApiWrapper({ signedIn: true }) });

    // The native view has its own file, so the web coverage says nothing about this one.
    await waitFor(() => expect(screen.getByText("$10.32")).toBeVisible());
    expect(screen.queryByText("10.32 USDC")).toBeNull();
    expect(screen.getByText(CARD_COPY.reward)).toBeVisible();
  });

  it("renders nothing when the read fails", async () => {
    let answered = false;
    server.use(
      http.get(CARD_REWARD_WALLET_URL, () => {
        answered = true;
        return HttpResponse.json({ message: "Internal server error" }, { status: 500 });
      }),
    );

    render(<Reward />, { wrapper: cardApiWrapper({ signedIn: true }) });

    await waitFor(() => expect(answered).toBe(true));
    expect(screen.queryByTestId("card-details-reward")).toBeNull();
  });
});
