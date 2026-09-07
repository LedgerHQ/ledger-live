import React from "react";
import { delay } from "msw";
import { mockStablecoinsResponse } from "@domain/api-aggregated-assets/mock/stablecoins";
import { renderWithMockedCounterValuesProvider, screen } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Account } from "@ledgerhq/types-live";
import PayTab from "LLD/features/PayTab";
import {
  BTC_ACCOUNT,
  ETH_ACCOUNT,
  ETH_ACCOUNT_WITH_USDC,
} from "LLD/features/__mocks__/accounts.mock";
import { usdcToken } from "LLD/features/__mocks__/useSelectAssetFlow.mock";
import { onboardedState, tourSeenState, UNISWAP } from "./fixtures";

const DADA_URLS = [
  "https://dada.api.ledger-test.com/v1/assets",
  "https://dada.api.ledger.com/v1/assets",
];

const ethWithoutTokens: Account = { ...ETH_ACCOUNT, subAccounts: [] };

const ethWithEmptyUsdc: Account = {
  ...ethWithoutTokens,
  subAccounts: [makeEmptyTokenAccount(ethWithoutTokens, usdcToken)],
};

const ethWithUniswap: Account = {
  ...ethWithoutTokens,
  subAccounts: [genTokenAccount(0, ethWithoutTokens, UNISWAP)],
};

function renderHero(accounts: Account[]) {
  return renderWithMockedCounterValuesProvider(<PayTab />, {
    initialState: { ...onboardedState, ...tourSeenState, accounts },
  });
}

async function expectEmptyHero() {
  expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
  expect(screen.queryByTestId("pay-card-balance-funded-state")).not.toBeInTheDocument();
}

async function expectFundedHero() {
  expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
  expect(screen.queryByTestId("pay-card-balance-empty-state")).not.toBeInTheDocument();
}

function dadaResponse() {
  return HttpResponse.json(mockStablecoinsResponse);
}

function setDada(mode: "hang" | "error") {
  server.use(
    ...DADA_URLS.map(url =>
      http.get(url, async ({ request }) => {
        if (mode === "hang") await delay("infinite");
        const isAmountQuery = new URL(request.url).searchParams.has("currencyIds");
        if (isAmountQuery && mode === "error") return HttpResponse.json(null, { status: 500 });
        return dadaResponse();
      }),
    ),
  );
}

function holdDada() {
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  server.use(
    ...DADA_URLS.map(url =>
      http.get(url, async () => {
        await gate;
        return dadaResponse();
      }),
    ),
  );
  return () => release();
}

describe("PayTab hero integration", () => {
  it("should be empty when there are no accounts", async () => {
    renderHero([]);

    await expectEmptyHero();
  });

  it("should be empty when accounts hold only crypto", async () => {
    renderHero([ethWithoutTokens, BTC_ACCOUNT]);

    await expectEmptyHero();
  });

  it("should be funded when accounts hold USDC", async () => {
    renderHero([ETH_ACCOUNT_WITH_USDC]);

    await expectFundedHero();
  });

  it("should be empty when the USDC holding has a zero balance", async () => {
    renderHero([ethWithEmptyUsdc]);

    await expectEmptyHero();
  });

  it("should stay empty while DADA hangs if the user holds no stablecoins", async () => {
    setDada("hang");
    renderHero([ethWithoutTokens, BTC_ACCOUNT]);

    await expectEmptyHero();
  });

  it("should stay funded while the catalog hangs if the user holds USDC", async () => {
    setDada("hang");
    renderHero([ETH_ACCOUNT_WITH_USDC]);

    await expectFundedHero();
  });

  it("should stay empty when DADA fails if the user holds no stablecoins", async () => {
    setDada("error");
    renderHero([ethWithoutTokens, BTC_ACCOUNT]);

    await expectEmptyHero();
  });

  it("should stay funded when DADA fails if the user holds USDC", async () => {
    setDada("error");
    renderHero([ETH_ACCOUNT_WITH_USDC]);

    await expectFundedHero();
  });

  it("should stay funded when DADA resolves a USDC holding", async () => {
    const release = holdDada();
    renderHero([ETH_ACCOUNT_WITH_USDC]);

    await expectFundedHero();
    release();
    await expectFundedHero();
  });

  it("should stay empty when DADA resolves with no stablecoin holding", async () => {
    const release = holdDada();
    renderHero([ethWithoutTokens, BTC_ACCOUNT]);

    await expectEmptyHero();
    release();
    await expectEmptyHero();
  });

  it("should be funded while DADA hangs if the user holds UNI, then empty when it resolves", async () => {
    const release = holdDada();
    renderHero([ethWithUniswap]);

    await expectFundedHero();
    release();
    await expectEmptyHero();
  });
});
