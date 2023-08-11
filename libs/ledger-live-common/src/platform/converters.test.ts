import { FAMILIES } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import "../__tests__/test-helpers/setup";

import { getPlatformTransactionSignFlowInfos } from "./converters";
import type { Transaction } from "../generated/types";
import type { PlatformTransaction } from "./types";

const ethBridge = jest.fn();
jest.mock("../generated/platformAdapter", () => {
  return {
    evm: {
      getPlatformTransactionSignFlowInfos: function () {
        return ethBridge();
      },
    },
  };
});

describe("getPlatformTransactionSignFlowInfos", () => {
  beforeEach(() => {
    ethBridge.mockClear();
  });

  it("calls the bridge if the implementation exists", () => {
    // Given
    const platformTx: PlatformTransaction = {
      family: FAMILIES.ETHEREUM,
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    getPlatformTransactionSignFlowInfos(platformTx);

    // Then
    expect(ethBridge).toBeCalledTimes(1);
  });

  it("uses its fallback if the bridge doesn't exist", () => {
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
    expect(ethBridge).toBeCalledTimes(0);
    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual(expectedLiveTx);
  });
});
