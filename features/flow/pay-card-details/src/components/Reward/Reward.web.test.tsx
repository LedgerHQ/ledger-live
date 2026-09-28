import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { mockPayCardRewardWallet } from "@domain/api-card-management/mock/card-wallets";
import { CARD_REWARD_WALLET_URL, listenToCardApi } from "@support/msw-features-flow-pay-card";
import { cardApiWrapper } from "../../__tests__/cardApiStore";
import { CARD_COPY } from "../../__tests__/i18nWrapper";
import { Reward } from "./Reward";

const server = listenToCardApi();

describe("Reward (web)", () => {
  it("renders nothing while nobody is signed in", () => {
    server.use(
      http.get(CARD_REWARD_WALLET_URL, () => HttpResponse.json(mockPayCardRewardWallet())),
    );

    render(<Reward />, { wrapper: cardApiWrapper({ signedIn: false }) });

    expect(screen.queryByTestId("card-details-reward")).not.toBeInTheDocument();
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
    expect(screen.queryByTestId("card-details-reward")).not.toBeInTheDocument();
  });
});
