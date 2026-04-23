import { renderHook, withFlagOverrides } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  BTC_ACCOUNT,
  ETH_ACCOUNT,
  ETH_ACCOUNT_WITH_USDC,
} from "LLD/features/__mocks__/accounts.mock";
import { createWalletState } from "../../../../testUtils/createWalletState";
import { useCryptoAccountRows } from "../useCryptoAccountRows";

const aggregatedFlags = withFlagOverrides({
  lwdWallet40: { enabled: true, params: { aggregatedAssets: true } },
});

describe("useCryptoAccountRows", () => {
  it("should return lookupParentAccount that resolves a main account by id", () => {
    const parent = genAccount("rows-parent-lookup", {
      currency: ETH_ACCOUNT.currency,
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
      currency: ETH_ACCOUNT.currency,
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
      currency: BTC_ACCOUNT.currency,
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

  it("should filter rows by search against account address", () => {
    const account = genAccount("rows-search-addr", {
      currency: BTC_ACCOUNT.currency,
      operationsSize: 0,
    });

    const { result, rerender } = renderHook(({ search }) => useCryptoAccountRows(search), {
      initialProps: { search: "" },
      initialState: {
        accounts: [account],
        ...createWalletState(new Map([[account.id, "My BTC"]])),
      },
    });

    const addressFragment = account.freshAddress.slice(0, 8);
    rerender({ search: addressFragment });
    expect(result.current.rows.map(a => a.id)).toContain(account.id);

    rerender({ search: "0xNOTAREALADDRESS999" });
    expect(result.current.rows).toHaveLength(0);
  });

  it("should match token accounts by parent address", () => {
    const parent = ETH_ACCOUNT_WITH_USDC;
    const token = parent.subAccounts![0];

    const addressFragment = parent.freshAddress.slice(0, 8);
    const { result } = renderHook(() => useCryptoAccountRows(addressFragment), {
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

  it("should include token sub-accounts in rows when they match search", () => {
    const parent = ETH_ACCOUNT_WITH_USDC;
    const token = parent.subAccounts![0];

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

  describe("when shouldDisplayAggregatedAssets is ON", () => {
    it("should return only main accounts, not token sub-accounts", () => {
      const parent = ETH_ACCOUNT_WITH_USDC;
      const token = parent.subAccounts![0];

      const { result } = renderHook(() => useCryptoAccountRows(""), {
        initialState: {
          accounts: [parent],
          ...aggregatedFlags,
          ...createWalletState(
            new Map([
              [parent.id, "Ethereum main"],
              [token.id, "USDC token"],
            ]),
          ),
        },
      });

      expect(result.current.rows.some(r => r.id === parent.id)).toBe(true);
      expect(result.current.rows.some(r => r.id === token.id)).toBe(false);
    });

    it("should match parent account when searching by token name (subMatch)", () => {
      const parent = ETH_ACCOUNT_WITH_USDC;
      const token = parent.subAccounts![0];

      const { result } = renderHook(() => useCryptoAccountRows("usdc"), {
        initialState: {
          accounts: [parent],
          ...aggregatedFlags,
          ...createWalletState(
            new Map([
              [parent.id, "Ethereum main"],
              [token.id, "USDC token"],
            ]),
          ),
        },
      });

      expect(result.current.rows.some(r => r.id === parent.id)).toBe(true);
    });
  });
});
