import React from "react";
import { BigNumber } from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { maticEth, usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { render, screen, within, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";

function withBalance<T extends Account | TokenAccount>(account: T, balance: string): T {
  return { ...account, balance: new BigNumber(balance), spendableBalance: new BigNumber(balance) };
}

const ethRoot = genAccount("account-detail-assets-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 2,
  subAccountsCount: 0,
});
const ethAccount: Account = {
  ...withBalance(ethRoot, "1000000000000000000"),
  subAccounts: [
    withBalance(genTokenAccount(0, ethRoot, usdcToken), "5000000"),
    withBalance(genTokenAccount(1, ethRoot, maticEth), "0"),
  ],
};
const emptyBtcAccount = genAccount("account-detail-assets-empty", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

type Settings = Readonly<{ blacklistedTokenIds?: string[]; hideEmptyTokenAccounts?: boolean }>;

function renderAccount(
  account: Account,
  { blacklistedTokenIds = [], hideEmptyTokenAccounts = false }: Settings = {},
) {
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
        return {
          ...withFlag,
          accounts: { ...withFlag.accounts, active: [ethAccount, emptyBtcAccount] },
          settings: { ...withFlag.settings, blacklistedTokenIds, hideEmptyTokenAccounts },
        };
      },
    },
  );
}

describe("AccountDetail assets", () => {
  it("lists the coin and its tokens with their balances", () => {
    renderAccount(ethAccount);

    const section = screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.assets);
    expect(within(section).getByText("Assets")).toBeVisible();
    expect(within(section).getByTestId("assetItem-Ethereum")).toBeVisible();
    expect(within(section).getByText("1 ETH")).toBeVisible();
    expect(within(section).getByTestId("assetItem-USD Coin")).toBeVisible();
    expect(within(section).getByText("5 USDC")).toBeVisible();
  });

  it("leaves out blacklisted tokens", () => {
    renderAccount(ethAccount, { blacklistedTokenIds: [usdcToken.id] });

    const section = screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.assets);
    expect(within(section).getByTestId("assetItem-Ethereum")).toBeVisible();
    expect(within(section).queryByTestId("assetItem-USD Coin")).toBeNull();
  });

  it("shows empty tokens when empty token accounts are not hidden", () => {
    renderAccount(ethAccount);

    const section = screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.assets);
    expect(within(section).getByTestId("assetItem-Matic")).toBeVisible();
  });

  it("hides empty tokens when empty token accounts are hidden", () => {
    renderAccount(ethAccount, { hideEmptyTokenAccounts: true });

    const section = screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.assets);
    expect(within(section).getByTestId("assetItem-USD Coin")).toBeVisible();
    expect(within(section).queryByTestId("assetItem-Matic")).toBeNull();
  });

  it("renders rows that cannot be pressed", () => {
    renderAccount(ethAccount);

    const section = screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.assets);
    expect(within(section).queryAllByRole("button")).toHaveLength(0);
  });

  it("hides the section when the account has no activity", () => {
    renderAccount(emptyBtcAccount);

    expect(screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.screen)).toBeVisible();
    expect(screen.queryByTestId(ACCOUNT_DETAIL_TEST_IDS.assets)).toBeNull();
  });
});
