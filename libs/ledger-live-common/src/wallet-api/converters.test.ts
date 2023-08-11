import BigNumber from "bignumber.js";
import "../__tests__/test-helpers/setup";

import { getWalletAPITransactionSignFlowInfos } from "./converters";
import type { Transaction } from "../generated/types";
import type { WalletAPITransaction } from "./types";

const ethBridge = jest.fn();
jest.mock("../generated/walletApiAdapter", () => {
  return {
    ethereum: {
      getWalletAPITransactionSignFlowInfos: function () {
        return ethBridge();
      },
    },
  };
});

describe("getWalletAPITransactionSignFlowInfos", () => {
  beforeEach(() => {
    ethBridge.mockClear();
  });

  it("calls the bridge if the implementation exists", () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "ethereum",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    getWalletAPITransactionSignFlowInfos(tx);

    // Then
    expect(ethBridge).toBeCalledTimes(1);
  });

  it("uses its fallback if the bridge doesn't exist", () => {
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
    expect(ethBridge).toBeCalledTimes(0);
    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual(expectedLiveTx);
  });
});
