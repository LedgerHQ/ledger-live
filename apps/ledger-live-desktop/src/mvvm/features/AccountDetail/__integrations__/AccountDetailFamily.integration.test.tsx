import React from "react";
import BigNumber from "bignumber.js";
import { Route, Routes } from "react-router";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, waitFor, within, withFlagOverrides } from "tests/testSetup";
import { HttpResponse, http, server } from "tests/server";
import { importLLDCoinFamily } from "~/renderer/families";
import { getAccountUrl } from "~/renderer/utils";
import AccountDetailRoute from "../AccountDetailRoute";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  SyncOneAccountOnMount: () => null,
}));

const FAMILY = "account-detail-family";
const DELEGATIONS = "account-detail-solana-delegations";
const VALIDATORS_URL = "https://earn.api.live.ledger.com/v0/network/solana/validator-details";
const VALIDATORS_SUMMARY_URL = "https://earn.api.live.ledger.com/figment/solana/validators_summary";

const endpoints = {
  validators: jest.fn<Response, [{ request: Request }]>(),
  summary: jest.fn<Response, [{ request: Request }]>(),
};

const solanaAccount = (seed: string, amount: number, operationsSize: number): Account => ({
  ...genAccount(seed, {
    currency: getCryptoCurrencyById("solana"),
    operationsSize,
  }),
  balance: new BigNumber(amount),
  spendableBalance: new BigNumber(amount),
});

const usedSolanaAccount = solanaAccount("account-detail-family-solana", 1_000_000_000, 2);
const emptySolanaAccount = solanaAccount("account-detail-family-solana-empty", 0, 0);

function renderAccount(account: Account) {
  return render(
    <Routes>
      <Route path="/account/:id/*" element={<AccountDetailRoute />} />
    </Routes>,
    {
      initialRoute: getAccountUrl(account.id),
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true } }),
        accounts: [account],
      },
    },
  );
}

describe("AccountDetail family section", () => {
  beforeAll(async () => {
    await Promise.all([
      importLLDCoinFamily(usedSolanaAccount.currency.family),
      getAccountBridge(usedSolanaAccount),
    ]);
  });

  beforeEach(() => {
    const { getSolanaValidators } = jest.requireActual("@ledgerhq/coin-solana/validators") as {
      getSolanaValidators: { reset: () => void };
    };
    getSolanaValidators.reset();
    endpoints.validators.mockReset().mockImplementation(() => HttpResponse.json([]));
    endpoints.summary.mockReset().mockImplementation(() => HttpResponse.json([]));
    server.use(
      http.get(VALIDATORS_URL, endpoints.validators),
      http.get(VALIDATORS_SUMMARY_URL, endpoints.summary),
    );
  });

  it("shows the family's custom section for a used account", async () => {
    renderAccount(usedSolanaAccount);

    const family = await screen.findByTestId(FAMILY);
    expect(within(family).getByTestId(DELEGATIONS)).toBeVisible();
    await waitFor(() => expect(endpoints.validators).toHaveBeenCalled());
  });

  it("hides the family's custom section when the account is empty", async () => {
    renderAccount(emptySolanaAccount);

    await screen.findByTestId(FAMILY);
    expect(screen.queryByTestId(DELEGATIONS)).toBeNull();
  });
});
