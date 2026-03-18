/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { useEvmGasOptions } from "../useEvmGasOptions";

jest.mock("@ledgerhq/coin-framework/account/helpers");
jest.mock("@ledgerhq/live-common/families/evm/react");

const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedUseGasOptions = jest.mocked(useGasOptions);

function buildCurrency(blockAvgTime?: number) {
  return {
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    blockAvgTime,
    units: [{ code: "ETH", magnitude: 18, name: "ETH" }],
  };
}

function buildAccount(blockAvgTime?: number): Account {
  return {
    id: "acc-eth",
    type: "Account",
    currency: buildCurrency(blockAvgTime),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
  } as unknown as Account;
}

const evmTransaction = {
  family: "evm",
  type: 2,
  amount: new BigNumber(0),
  recipient: "0xrecipient",
} as unknown as EvmTransaction;

describe("useEvmGasOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseGasOptions.mockReturnValue([undefined, null, true]);
  });

  it("derives the polling interval from blockAvgTime (blockAvgTime * 1000)", () => {
    const account = buildAccount(15);
    mockedGetMainAccount.mockReturnValue(account);

    renderHook(() => useEvmGasOptions(account as AccountLike, null, evmTransaction));

    expect(mockedUseGasOptions).toHaveBeenCalledWith(expect.objectContaining({ interval: 15_000 }));
  });

  it("passes undefined interval when blockAvgTime is not set", () => {
    const account = buildAccount(undefined);
    mockedGetMainAccount.mockReturnValue(account);

    renderHook(() => useEvmGasOptions(account as AccountLike, null, evmTransaction));

    expect(mockedUseGasOptions).toHaveBeenCalledWith(
      expect.objectContaining({ interval: undefined }),
    );
  });

  it("delegates the currency and transaction to useGasOptions", () => {
    const account = buildAccount(12);
    mockedGetMainAccount.mockReturnValue(account);

    renderHook(() => useEvmGasOptions(account as AccountLike, null, evmTransaction));

    expect(mockedUseGasOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: account.currency,
        transaction: evmTransaction,
      }),
    );
  });

  it("normalises a null error to undefined in the returned tuple", () => {
    const account = buildAccount(12);
    mockedGetMainAccount.mockReturnValue(account);
    mockedUseGasOptions.mockReturnValue([undefined, null, false]);

    const { result } = renderHook(() =>
      useEvmGasOptions(account as AccountLike, null, evmTransaction),
    );

    const [, error, loading] = result.current;
    expect(error).toBeUndefined();
    expect(loading).toBe(false);
  });

  it("forwards a real error through", () => {
    const account = buildAccount(12);
    mockedGetMainAccount.mockReturnValue(account);
    const err = new Error("gas tracker unavailable");
    mockedUseGasOptions.mockReturnValue([undefined, err, false]);

    const { result } = renderHook(() =>
      useEvmGasOptions(account as AccountLike, null, evmTransaction),
    );

    expect(result.current[1]).toBe(err);
  });
});
