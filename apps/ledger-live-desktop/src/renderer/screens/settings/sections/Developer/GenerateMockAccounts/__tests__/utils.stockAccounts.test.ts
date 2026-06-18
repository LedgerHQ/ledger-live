import { genAccount } from "@ledgerhq/live-common/mock/account";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import {
  initialState as liveWalletInitialState,
  accountUserDataExportSelector,
} from "@ledgerhq/live-wallet/store";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getKey } from "~/renderer/storage";
import { countStockTokenAccounts, removeStockAccounts } from "../utils";

jest.mock("~/renderer/storage", () => ({
  getKey: jest.fn(),
}));

const mockGetKey = jest.mocked(getKey);
const mockDispatch = jest.fn();

const solana = getCryptoCurrencyById("solana");

const aaplx = {
  type: "TokenCurrency",
  id: "solana/spl/applex",
  parentCurrencyId: "solana",
  name: "Apple xStock",
  ticker: "AAPLX",
} as TokenCurrency;

const tslax = {
  type: "TokenCurrency",
  id: "solana/spl/teslax",
  parentCurrencyId: "solana",
  name: "Tesla xStock",
  ticker: "TSLAX",
} as TokenCurrency;

const usdc = {
  type: "TokenCurrency",
  id: "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v",
  parentCurrencyId: "solana",
  name: "USD Coin",
  ticker: "USDC",
} as TokenCurrency;

function createParentWithSubs() {
  const account = genAccount("parent", { currency: solana });
  account.subAccounts = [
    genTokenAccount(0, account, aaplx),
    genTokenAccount(1, account, tslax),
    genTokenAccount(2, account, usdc),
  ];
  const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
  return [account, userData] as const;
}

describe("countStockTokenAccounts", () => {
  it("counts stock token sub-accounts", () => {
    const [account] = createParentWithSubs();

    expect(countStockTokenAccounts([account], new Set(["solana/spl/applex"]))).toBe(1);
    expect(
      countStockTokenAccounts([account], new Set(["solana/spl/applex", "solana/spl/teslax"])),
    ).toBe(2);
  });

  it("does not double-count flattened accounts", () => {
    const [account] = createParentWithSubs();
    const flattened = flattenAccounts([account]);

    expect(
      countStockTokenAccounts(flattened, new Set(["solana/spl/applex", "solana/spl/teslax"])),
    ).toBe(2);
  });
});

describe("removeStockAccounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.ledger = { store: { dispatch: mockDispatch } } as unknown as typeof window.ledger;
  });

  it("removes stock token sub-accounts while preserving other sub-accounts and parent accounts", async () => {
    const [account, userData] = createParentWithSubs();
    mockGetKey.mockResolvedValue([[account, userData]]);

    const removedCount = await removeStockAccounts(
      new Set(["solana/spl/applex", "solana/spl/teslax"]),
    );

    expect(removedCount).toBe(2);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const dispatchedAccounts = mockDispatch.mock.calls[0][0].payload.accounts;
    expect(dispatchedAccounts).toHaveLength(1);
    expect(dispatchedAccounts[0].id).toBe(account.id);
    expect(dispatchedAccounts[0].subAccounts).toHaveLength(1);
    expect(dispatchedAccounts[0].subAccounts?.[0]?.token.id).toBe(usdc.id);
  });

  it("keeps parent accounts even when all sub-accounts are stock tokens", async () => {
    const account = genAccount("empty-parent", { currency: solana, operationsSize: 0 });
    account.balance = account.balance.minus(account.balance);
    account.subAccounts = [genTokenAccount(0, account, aaplx)];
    const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
    mockGetKey.mockResolvedValue([[account, userData]]);

    const removedCount = await removeStockAccounts(new Set(["solana/spl/applex"]));

    expect(removedCount).toBe(1);
    const dispatchedAccounts = mockDispatch.mock.calls[0][0].payload.accounts;
    expect(dispatchedAccounts).toHaveLength(1);
    expect(dispatchedAccounts[0].id).toBe(account.id);
    expect(dispatchedAccounts[0].subAccounts).toEqual([]);
  });

  it("returns 0 when there are no stock token sub-accounts to remove", async () => {
    const account = genAccount("no-stocks", { currency: solana });
    account.subAccounts = [genTokenAccount(0, account, usdc)];
    const userData = accountUserDataExportSelector(liveWalletInitialState, { account });
    mockGetKey.mockResolvedValue([[account, userData]]);

    const removedCount = await removeStockAccounts(new Set(["solana/spl/applex"]));

    expect(removedCount).toBe(0);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          accounts: [account],
        }),
      }),
    );
  });
});
