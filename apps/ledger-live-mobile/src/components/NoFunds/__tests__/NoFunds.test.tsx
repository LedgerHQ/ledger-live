import React from "react";
import { render, screen } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import type { NoFundsNavigatorParamList } from "~/components/RootNavigator/types/NoFundsNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import NoFunds from "../NoFunds";

type NoFundsProps = StackNavigatorProps<NoFundsNavigatorParamList, ScreenName.NoFunds>;

const mockNavigateToSwapTab = jest.fn();

jest.mock("~/screens/Swap/navigation/navigateToSwapTab", () => ({
  navigateToSwapTab: (...args: unknown[]) => mockNavigateToSwapTab(...args),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: () => ({ data: ["ethereum", "ethereum/erc20/usd__coin"] }),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: () => true }),
}));

const ethereum = getCryptoCurrencyById("ethereum");
const ethAccount = genAccount("eth-1", { currency: ethereum });

// NoFunds reads its navigation from useNavigation, so the prop is only here to satisfy the type.
const navigation = {} as unknown as NoFundsProps["navigation"];

function renderNoFunds(account: AccountLike, parentAccount: Account | undefined, store: Account[]) {
  const route: NoFundsProps["route"] = {
    key: "NoFunds",
    name: ScreenName.NoFunds,
    params: { account, parentAccount },
  };

  return render(<NoFunds route={route} navigation={navigation} />, {
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: store },
    }),
  });
}

describe("NoFunds", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes the account to Swap when it exists in the store", async () => {
    const { user } = renderNoFunds(ethAccount, undefined, [ethAccount]);

    await user.press(screen.getByText("Swap"));

    const { params } = mockNavigateToSwapTab.mock.calls[0][0];
    expect(params.defaultAccount).toBe(ethAccount);
    expect(params.defaultCurrency).toEqual(ethereum);
  });

  it("passes the asset only when the token account is absent from the store", async () => {
    // Shape `custom.getFunds` produces when the user holds none of the token yet: the
    // account exists nowhere, so its id cannot be resolved by the Swap live app.
    const syntheticUsdcAccount = makeEmptyTokenAccount(ethAccount, usdcToken);

    const { user } = renderNoFunds(syntheticUsdcAccount, ethAccount, [ethAccount]);

    await user.press(screen.getByText("Swap"));

    const { params } = mockNavigateToSwapTab.mock.calls[0][0];
    expect(params.defaultAccount).toBeUndefined();
    expect(params.defaultParentAccount).toBeUndefined();
    expect(params.defaultCurrency).toEqual(usdcToken);
  });
});
