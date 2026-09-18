import React from "react";
import { render, screen, fireEvent } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import NoFunds from "../NoFunds";

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

function renderNoFunds(account: AccountLike, parentAccount: Account | undefined, store: Account[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = { params: { account, parentAccount } } as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return render(<NoFunds route={route} {...({} as any)} />, {
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: store },
    }),
  });
}

describe("NoFunds", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes the account to Swap when it exists in the store", () => {
    renderNoFunds(ethAccount, undefined, [ethAccount]);

    fireEvent.press(screen.getByText("Swap"));

    const { params } = mockNavigateToSwapTab.mock.calls[0][0];
    expect(params.defaultAccount).toBe(ethAccount);
    expect(params.defaultCurrency).toEqual(ethereum);
  });

  it("passes the asset only when the token account is absent from the store", () => {
    // Shape `custom.getFunds` produces when the user holds none of the token yet: the
    // account exists nowhere, so its id cannot be resolved by the Swap live app.
    const syntheticUsdcAccount = makeEmptyTokenAccount(ethAccount, usdcToken);

    renderNoFunds(syntheticUsdcAccount, ethAccount, [ethAccount]);

    fireEvent.press(screen.getByText("Swap"));

    const { params } = mockNavigateToSwapTab.mock.calls[0][0];
    expect(params.defaultAccount).toBeUndefined();
    expect(params.defaultParentAccount).toBeUndefined();
    expect(params.defaultCurrency).toEqual(usdcToken);
  });
});
