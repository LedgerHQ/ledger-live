import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { mockPayCardCashback } from "@domain/api-card-management/mock/card-cashback";
import { CARD_CASHBACK_URL, listenToCardApi } from "@support/msw-features-flow-pay-card";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { cardApiWrapper } from "../../__tests__/cardApiStore";
import { REWARD_SUBTITLE } from "../../__tests__/i18nWrapper";
import { Reward } from "./Reward";
import type { RewardProps } from "./types";

const server = listenToCardApi();

/** The Ledger id the api resolves the cashback's `BTC` to. */
const BTC_LEDGER_ID = "bitcoin";

const BTC = { id: BTC_LEDGER_ID, ticker: "BTC" } as unknown as CryptoOrTokenCurrency;

/** Pricing as the host hands it over: the resolved currencies, a rate, and a formatter. */
const pricing: RewardProps = {
  currencies: new Map([[BTC_LEDGER_ID, BTC]]),
  getCounterValue: () => 1032,
  formatCountervalue: (value: number) => `$${(value / 100).toFixed(2)}`,
};

describe("Reward (native)", () => {
  it("renders nothing while nobody is signed in", () => {
    server.use(http.get(CARD_CASHBACK_URL, () => HttpResponse.json(mockPayCardCashback())));

    render(<Reward />, { wrapper: cardApiWrapper({ signedIn: false }) });

    expect(screen.queryByTestId("card-details-reward")).toBeNull();
  });

  it("renders the reward card once the cashback arrives", async () => {
    server.use(http.get(CARD_CASHBACK_URL, () => HttpResponse.json(mockPayCardCashback())));

    render(<Reward />, { wrapper: cardApiWrapper({ signedIn: true }) });

    await waitFor(() => expect(screen.getByTestId("card-details-reward")).toBeVisible());
    expect(screen.getByText("0.00294697 BTC")).toBeVisible();
    expect(screen.getByText(REWARD_SUBTITLE)).toBeVisible();
  });

  it("leads with the counter-value once the host can price the reward", async () => {
    server.use(http.get(CARD_CASHBACK_URL, () => HttpResponse.json(mockPayCardCashback())));

    render(<Reward {...pricing} />, { wrapper: cardApiWrapper({ signedIn: true }) });

    // The native view has its own file, so the web coverage says nothing about this one.
    await waitFor(() => expect(screen.getByText("$10.32")).toBeVisible());
    expect(screen.queryByText("0.00294697 BTC")).toBeNull();
    expect(screen.getByText(REWARD_SUBTITLE)).toBeVisible();
  });

  it("renders nothing when the read fails", async () => {
    let answered = false;
    server.use(
      http.get(CARD_CASHBACK_URL, () => {
        answered = true;
        return HttpResponse.json({ message: "Internal server error" }, { status: 500 });
      }),
    );

    render(<Reward />, { wrapper: cardApiWrapper({ signedIn: true }) });

    await waitFor(() => expect(answered).toBe(true));
    expect(screen.queryByTestId("card-details-reward")).toBeNull();
  });
});
