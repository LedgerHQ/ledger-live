import type { Account } from "@ledgerhq/types-live";
import { renderHook } from "tests/testSetup";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { useAddressListItemViewModel } from "../useAddressListItemViewModel";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

const initialState = {
  settings: { counterValue: "USD", locale: "en-US", discreetMode: false },
};

describe("useAddressListItemViewModel", () => {
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
      expectedId: usdcToken.parentCurrency.id,
      expectedTicker: usdcToken.parentCurrency.ticker,
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
