import BigNumber from "bignumber.js";
import "../__tests__/test-helpers/setup";

import { getWalletAPITransactionSignFlowInfos } from "./converters";
import type { Transaction } from "../generated/types";
import type { WalletAPITransaction } from "./types";

const evmBridge = jest.fn();
const bitcoinBridge = jest.fn();
jest.mock("../generated/walletApiAdapter", () => {
  return {
    evm: {
      getWalletAPITransactionSignFlowInfos: function () {
        return evmBridge();
      },
    },
    bitcoin: {
      getWalletAPITransactionSignFlowInfos: function () {
        return bitcoinBridge();
      },
    },
  };
});

describe("getWalletAPITransactionSignFlowInfos", () => {
  beforeEach(() => {
    evmBridge.mockClear();
    bitcoinBridge.mockClear();
  });

  it("should call the bridge if the implementation exists", () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "bitcoin",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    getWalletAPITransactionSignFlowInfos(tx);

    // Then
    expect(bitcoinBridge).toBeCalledTimes(1);
    expect(evmBridge).toBeCalledTimes(0);
  });

  it("should call the evm bridge for WalletAPITransaction tx of ethereum family", () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "ethereum",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    getWalletAPITransactionSignFlowInfos(tx);

    // Then
    expect(evmBridge).toBeCalledTimes(1);
    expect(bitcoinBridge).toBeCalledTimes(0);
  });

  it("should use its fallback if the bridge doesn't exist", () => {
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
    const { canEditFees, hasFeesProvided, liveTx } = getWalletAPITransactionSignFlowInfos(tx);

    // Then
    expect(evmBridge).toBeCalledTimes(0);
    expect(bitcoinBridge).toBeCalledTimes(0);
    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual(expectedLiveTx);
  });
});
