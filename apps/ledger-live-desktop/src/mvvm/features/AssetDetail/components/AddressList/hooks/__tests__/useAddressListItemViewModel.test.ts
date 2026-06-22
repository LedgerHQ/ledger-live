import type { Account } from "@ledgerhq/types-live";
import type { WalletState } from "@ledgerhq/live-wallet/store";
import { renderHook } from "tests/testSetup";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { useAddressListItemViewModel } from "../useAddressListItemViewModel";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

const walletStateWithAccountName = (accountId: string, name: string): WalletState => ({
  accountNames: new Map([[accountId, name]]),
  starredAccountIds: new Set(),
  walletSyncState: { data: null, version: 0 },
  nonImportedAccountInfos: [],
  recentAddresses: {},
});

const initialState = {
  settings: { counterValue: "USD", locale: "en-US", discreetMode: false },
};

describe("useAddressListItemViewModel", () => {
  it("uses renamed account name from wallet state", () => {
    const customName = "My Custom ETH";

    const { result } = renderHook(
      () =>
        useAddressListItemViewModel(
          ETH_ACCOUNT,
          () => null,
          () => {},
        ),
      {
        initialState: {
          ...initialState,
          wallet: walletStateWithAccountName(ETH_ACCOUNT.id, customName),
        },
      },
    );

    expect(result.current.displayName).toBe(customName);
  });

  it("uses parent account renamed name for token accounts", () => {
    const customName = "My Custom ETH";
    const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

    const { result } = renderHook(
      () =>
        useAddressListItemViewModel(
          tokenAccount,
          () => ETH_ACCOUNT,
          () => {},
        ),
      {
        initialState: {
          ...initialState,
          wallet: walletStateWithAccountName(ETH_ACCOUNT.id, customName),
        },
      },
    );

    expect(result.current.displayName).toBe(customName);
  });

  it.each([
    {
      label: "parent account is resolved",
      lookup: (_id: string): Account | null => ETH_ACCOUNT,
      expectedId: ETH_ACCOUNT.currency.id,
      expectedTicker: ETH_ACCOUNT.currency.ticker,
    },
    {
      label: "parent account is missing",
      lookup: (_id: string): Account | null => null,
      expectedId: usdcToken.parentCurrencyId,
      expectedTicker: getCryptoCurrencyById(usdcToken.parentCurrencyId).ticker,
    },
  ])(
    "uses chain currency for network icon when $label",
    ({ lookup, expectedId, expectedTicker }) => {
      const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

      const { result } = renderHook(
        () => useAddressListItemViewModel(tokenAccount, lookup, () => {}),
        { initialState },
      );

      expect(result.current.networkLedgerId).toBe(expectedId);
      expect(result.current.networkTicker).toBe(expectedTicker);
    },
  );
});
