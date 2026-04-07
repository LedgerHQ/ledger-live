import { FAMILIES } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import "../__tests__/test-helpers/setup";

import { getPlatformTransactionSignFlowInfos } from "./converters";
import type { Transaction } from "../generated/types";
import type { PlatformTransaction } from "./types";

const evmBridge = jest.fn();
const bitcoinBridge = jest.fn();
jest.mock("../coin-modules/registry", () => ({
  ...jest.requireActual("../coin-modules/registry"),
  loadPlatformAdapterForFamily: jest.fn((family: string) => {
    if (family === "evm") {
      return Promise.resolve({
        getPlatformTransactionSignFlowInfos: function () {
          return evmBridge();
        },
      });
    }
    if (family === "bitcoin") {
      return Promise.resolve({
        getPlatformTransactionSignFlowInfos: function () {
          return bitcoinBridge();
        },
      });
    }
    return Promise.resolve(undefined);
  }),
}));

describe("getPlatformTransactionSignFlowInfos", () => {
  beforeEach(() => {
    evmBridge.mockClear();
    bitcoinBridge.mockClear();
  });

  it("should call the bridge if the implementation exists", async () => {
    // Given
    const tx: PlatformTransaction = {
      family: FAMILIES.BITCOIN,
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    await getPlatformTransactionSignFlowInfos(tx);

    // Then
    expect(bitcoinBridge).toHaveBeenCalledTimes(1);
    expect(evmBridge).toHaveBeenCalledTimes(0);
  });

  it("should call the evm bridge for PlatformTransaction tx of ethereum family", async () => {
    // Given
    const tx: PlatformTransaction = {
      family: FAMILIES.ETHEREUM,
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    await getPlatformTransactionSignFlowInfos(tx);

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(1);
    expect(bitcoinBridge).toHaveBeenCalledTimes(0);
  });

  it("should use its fallback if the bridge doesn't exist", async () => {
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
      await getPlatformTransactionSignFlowInfos(platformTx);

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(0);
    expect(bitcoinBridge).toHaveBeenCalledTimes(0);
    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual(expectedLiveTx);
  });
});
