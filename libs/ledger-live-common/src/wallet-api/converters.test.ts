import type { Account, AccountLike } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import "../__tests__/test-helpers/setup";
import type { Transaction } from "../coin-modules/transaction-types";
import { getAccountBridge } from "../bridge";
import {
  getWalletAPITransactionSignFlowInfos,
  resolveWalletApiSpendableBalance,
} from "./converters";
import type { WalletAPITransaction } from "./types";

const evmBridge = jest.fn();
const bitcoinBridge = jest.fn();
jest.mock("../coin-modules/registry", () => ({
  loadWalletApiAdapterForFamily: (family: string) => {
    switch (family) {
      case "evm":
        return { getWalletAPITransactionSignFlowInfos: () => evmBridge() };
      case "bitcoin":
        return { getWalletAPITransactionSignFlowInfos: () => bitcoinBridge() };
      default:
        return undefined;
    }
  },
}));

jest.mock("../bridge", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/logs", () => ({
  ...jest.requireActual("@ledgerhq/logs"),
  log: jest.fn(),
}));

const mockLog = jest.mocked(log);
const mockGetAccountBridge = jest.mocked(getAccountBridge);

describe("getWalletAPITransactionSignFlowInfos", () => {
  beforeEach(() => {
    evmBridge.mockClear();
    bitcoinBridge.mockClear();
  });

  it("should call the bridge if the implementation exists", async () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "bitcoin",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: tx,
      account: {} as Account,
    });

    // Then
    expect(bitcoinBridge).toHaveBeenCalledTimes(1);
    expect(evmBridge).toHaveBeenCalledTimes(0);
  });

  it("should call the evm bridge for WalletAPITransaction tx of ethereum family", async () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "ethereum",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: tx,
      account: {} as Account,
    });

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(1);
    expect(bitcoinBridge).toHaveBeenCalledTimes(0);
  });

  it("should use its fallback if the bridge doesn't exist", async () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "algorand",
      mode: "send",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    const expectedLiveTx: Partial<Transaction> = {
      family: tx.family,
      mode: "send",
      amount: tx.amount,
      recipient: tx.recipient,
    };

    // When
    const { canEditFees, hasFeesProvided, liveTx } = await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: tx,
      account: {} as Account,
    });

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(0);
    expect(bitcoinBridge).toHaveBeenCalledTimes(0);
    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual(expectedLiveTx);
  });
});

describe("resolveWalletApiSpendableBalance", () => {
  const account = { spendableBalance: new BigNumber(100) } as AccountLike;

  beforeEach(() => {
    mockGetAccountBridge.mockReset();
    mockLog.mockClear();
  });

  it("returns the bridge's getWalletApiSpendableBalance result", async () => {
    // Given
    const bridgeSpendableBalance = new BigNumber(42);

    mockGetAccountBridge.mockResolvedValue({
      getWalletApiSpendableBalance: jest.fn().mockReturnValue(bridgeSpendableBalance),
    } as never);

    // When
    const result = await resolveWalletApiSpendableBalance(account);

    // Then
    expect(result).toEqual(bridgeSpendableBalance);
  });

  it("falls back to account.spendableBalance and logs when the bridge lookup fails", async () => {
    // Given
    mockGetAccountBridge.mockRejectedValue(new Error("unsupported family"));

    // When
    const result = await resolveWalletApiSpendableBalance(account);

    // Then
    expect(result).toEqual(account.spendableBalance);
    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog).toHaveBeenCalledWith(
      "wallet-api/converters",
      expect.stringContaining("falling back to account.spendableBalance"),
      { error: "unsupported family" },
    );
  });
});
