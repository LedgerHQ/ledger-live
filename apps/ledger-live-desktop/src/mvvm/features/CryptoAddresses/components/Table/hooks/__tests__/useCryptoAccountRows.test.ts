import { renderHook } from "tests/testSetup";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { WalletState } from "@ledgerhq/live-wallet/store";
import { useCryptoAccountRows } from "../useCryptoAccountRows";

const ethereumCurrency = getCryptoCurrencyById("ethereum");

function createWalletState(accountNames: Map<string, string>): { wallet: WalletState } {
  return {
    wallet: {
      accountNames,
      starredAccountIds: new Set(),
      nonImportedAccountInfos: [],
      walletSyncState: { data: null, version: 0 },
      recentAddresses: {},
    },
  };
}

describe("useCryptoAccountRows", () => {
  it("should return lookupParentAccount that resolves a main account by id", () => {
    const parent = genAccount("rows-parent-lookup", {
      currency: ethereumCurrency,
      operationsSize: 0,
    });

    const { result } = renderHook(() => useCryptoAccountRows(""), {
      initialState: {
        accounts: [parent],
        ...createWalletState(new Map([[parent.id, "Ethereum main"]])),
      },
    });

    expect(result.current.lookupParentAccount(parent.id)).toBe(parent);
    expect(result.current.lookupParentAccount("unknown-id")).toBeNull();
  });

  it("should include flattened accounts when search is empty", () => {
    const account = genAccount("rows-flat-1", {
      currency: ethereumCurrency,
      operationsSize: 0,
    });

    const { result } = renderHook(() => useCryptoAccountRows(""), {
      initialState: {
        accounts: [account],
        ...createWalletState(new Map([[account.id, "My Eth"]])),
      },
    });

    expect(result.current.rows.map(a => a.id)).toContain(account.id);
  });

  it("should filter rows by search against account name and ticker", () => {
    const account = genAccount("rows-search-btc", {
      currency: getCryptoCurrencyById("bitcoin"),
      operationsSize: 0,
    });

    const { result, rerender } = renderHook(({ search }) => useCryptoAccountRows(search), {
      initialProps: { search: "" },
      initialState: {
        accounts: [account],
        ...createWalletState(new Map([[account.id, "Cold storage"]])),
      },
    });

    expect(result.current.rows.map(a => a.id)).toContain(account.id);

    rerender({ search: "nomatch-xyz" });
    expect(result.current.rows).toHaveLength(0);

    rerender({ search: "btc" });
    expect(result.current.rows.map(a => a.id)).toContain(account.id);

    rerender({ search: "cold" });
    expect(result.current.rows.map(a => a.id)).toContain(account.id);
  });

  it("should include token sub-accounts in rows when they match search", () => {
    const parent = genAccount("rows-token-parent", {
      currency: ethereumCurrency,
      operationsSize: 0,
    });
    const token = genTokenAccount(0, parent, usdcToken);
    parent.subAccounts = [token];

    const { result } = renderHook(() => useCryptoAccountRows("usdc"), {
      initialState: {
        accounts: [parent],
        ...createWalletState(
          new Map([
            [parent.id, "Parent"],
            [token.id, "USDC token"],
          ]),
        ),
      },
    });

    expect(result.current.rows.some(r => r.id === token.id)).toBe(true);
  });
});
