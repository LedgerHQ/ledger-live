import { FAMILIES } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import "../__tests__/test-helpers/setup";

import { getPlatformTransactionSignFlowInfos } from "./converters";
import type { Transaction } from "../generated/types";
import type { PlatformTransaction } from "./types";

const evmBridge = jest.fn();
const bitcoinBridge = jest.fn();
jest.mock("../generated/platformAdapter", () => {
  return {
    evm: {
      getPlatformTransactionSignFlowInfos: function () {
        return evmBridge();
      },
    },
    bitcoin: {
      getPlatformTransactionSignFlowInfos: function () {
        return bitcoinBridge();
      },
    },
  };
});

describe("getPlatformTransactionSignFlowInfos", () => {
  beforeEach(() => {
    evmBridge.mockClear();
    bitcoinBridge.mockClear();
  });

  it("should call the bridge if the implementation exists", () => {
    // Given
    const tx: PlatformTransaction = {
      family: FAMILIES.BITCOIN,
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    getPlatformTransactionSignFlowInfos(tx);

    // Then
    expect(bitcoinBridge).toBeCalledTimes(1);
    expect(evmBridge).toBeCalledTimes(0);
  });

  it("should call the evm bridge for PlatformTransaction tx of ethereum family", () => {
    // Given
    const tx: PlatformTransaction = {
      family: FAMILIES.ETHEREUM,
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    getPlatformTransactionSignFlowInfos(tx);

    // Then
    expect(evmBridge).toBeCalledTimes(1);
    expect(bitcoinBridge).toBeCalledTimes(0);
  });

  it("should use its fallback if the bridge doesn't exist", () => {
    // Given
    const platformTx: PlatformTransaction = {
      family: FAMILIES.ALGORAND,
      mode: "send",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    const expectedLiveTx: Partial<Transaction> = {
      family: platformTx.family,
      mode: "send",
      amount: platformTx.amount,
      recipient: platformTx.recipient,
    };

    // When
    const { canEditFees, hasFeesProvided, liveTx } =
      getPlatformTransactionSignFlowInfos(platformTx);

    // Then
    expect(evmBridge).toBeCalledTimes(0);
    expect(bitcoinBridge).toBeCalledTimes(0);
    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual(expectedLiveTx);
  });
});
