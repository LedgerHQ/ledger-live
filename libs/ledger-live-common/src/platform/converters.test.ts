import { FAMILIES } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import "../__tests__/test-helpers/setup";

import { getPlatformTransactionSignFlowInfos } from "./converters";
import type { Transaction } from "../coin-modules/transaction-types";
import type { PlatformTransaction } from "./types";

const evmBridge = jest.fn();
const bitcoinBridge = jest.fn();
const zcashBridge = jest.fn();
jest.mock("../coin-modules/registry", () => ({
  loadPlatformAdapterForFamily: (family: string) => {
    switch (family) {
      case "evm":
        return { getPlatformTransactionSignFlowInfos: () => evmBridge() };
      case "bitcoin":
        return { getPlatformTransactionSignFlowInfos: () => bitcoinBridge() };
      case "zcash":
        return { getPlatformTransactionSignFlowInfos: () => zcashBridge() };
      default:
        return undefined;
    }
  },
}));

const accountOf = (currencyId: string): AccountLike =>
  ({ type: "Account", currency: getCryptoCurrencyById(currencyId) }) as AccountLike;

describe("getPlatformTransactionSignFlowInfos", () => {
  beforeEach(() => {
    evmBridge.mockClear();
    bitcoinBridge.mockClear();
    zcashBridge.mockClear();
  });

  it("should call the bridge if the implementation exists", async () => {
    // Given
    const tx: PlatformTransaction = {
      family: FAMILIES.BITCOIN,
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    await getPlatformTransactionSignFlowInfos(tx, accountOf("bitcoin"));

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
    await getPlatformTransactionSignFlowInfos(tx, accountOf("ethereum"));

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(1);
    expect(bitcoinBridge).toHaveBeenCalledTimes(0);
  });

  it.each(["zcash", "zcash_testnet"])(
    "should call the zcash bridge for a bitcoin PlatformTransaction on a %s account",
    async currencyId => {
      // Given
      const tx: PlatformTransaction = {
        family: FAMILIES.BITCOIN,
        amount: new BigNumber(100000),
        recipient: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
      };

      // When
      await getPlatformTransactionSignFlowInfos(tx, accountOf(currencyId));

      // Then
      expect(zcashBridge).toHaveBeenCalledTimes(1);
      expect(bitcoinBridge).toHaveBeenCalledTimes(0);
    },
  );

  it("should keep the transaction's own bridge when it is not the zcash account's live-app family", async () => {
    // Given
    const tx: PlatformTransaction = {
      family: FAMILIES.ETHEREUM,
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    await getPlatformTransactionSignFlowInfos(tx, accountOf("zcash"));

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(1);
    expect(zcashBridge).toHaveBeenCalledTimes(0);
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
    const { canEditFees, hasFeesProvided, liveTx } = await getPlatformTransactionSignFlowInfos(
      platformTx,
      accountOf("algorand"),
    );

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(0);
    expect(bitcoinBridge).toHaveBeenCalledTimes(0);
    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual(expectedLiveTx);
  });
});
