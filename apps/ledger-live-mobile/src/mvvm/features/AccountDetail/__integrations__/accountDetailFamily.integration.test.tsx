import React from "react";
import { BigNumber } from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { HttpResponse, http, server } from "@tests/server";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";

const DELEGATIONS = "account-detail-solana-delegations";
const HERO = "account-detail-hero";
const VALIDATORS_URL = "https://earn.api.live.ledger.com/v0/network/solana/validator-details";
const VALIDATORS_SUMMARY_URL = "https://earn.api.live.ledger.com/figment/solana/validators_summary";

const endpoints = {
  validators: jest.fn<Response, [{ request: Request }]>(),
  summary: jest.fn<Response, [{ request: Request }]>(),
};

const solanaAccount = (seed: string, amount: number, operationsSize: number) => ({
  ...genAccount(seed, {
    currency: getCryptoCurrencyById("solana"),
    operationsSize,
  }),
  balance: new BigNumber(amount),
  spendableBalance: new BigNumber(amount),
  stakingResources: {
    delegations: [],
    redelegations: [],
    unbondings: [],
    delegatedBalance: new BigNumber(0),
    pendingRewardsBalance: new BigNumber(0),
    unbondingBalance: new BigNumber(0),
  },
});

const usedSolanaAccount = solanaAccount("account-detail-family-solana", 1_000_000_000, 2);
const emptySolanaAccount = solanaAccount("account-detail-family-solana-empty", 0, 0);

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function renderAccount(account: Account) {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: account.id }}
      />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return { ...withFlag, accounts: { ...withFlag.accounts, active: [account] } };
      },
    },
  );
}

describe("AccountDetail family section", () => {
  beforeAll(async () => {
    await getAccountBridge(usedSolanaAccount);
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

    expect(await screen.findByTestId(DELEGATIONS)).toBeVisible();
    await waitFor(() => expect(endpoints.validators).toHaveBeenCalled());
  });

  it("hides the family's custom section when the account is empty", async () => {
    renderAccount(emptySolanaAccount);

    expect(await screen.findByTestId(HERO)).toBeVisible();
    expect(screen.queryByTestId(DELEGATIONS)).toBeNull();
  });
});
