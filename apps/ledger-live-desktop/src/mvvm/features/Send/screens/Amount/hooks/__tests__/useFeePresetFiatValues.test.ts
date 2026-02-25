/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook, waitFor } from "tests/testSetup";
import { useFeePresetFiatValues } from "../useFeePresetFiatValues";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import { createMockAccount } from "../../../Recipient/__integrations__/__fixtures__/accounts";
import type { FeePresetOption } from "../useFeePresetOptions";

jest.mock("@ledgerhq/live-common/bridge/index");
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: jest.fn(),
}));
jest.mock("@ledgerhq/coin-framework/currencies/formatCurrencyUnit");

const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const mockedUseCalculateCountervalueCallback = jest.mocked(useCalculateCountervalueCallback);
const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);

describe("useFeePresetFiatValues", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseCalculateCountervalueCallback.mockReturnValue((_from, value) => value);
    mockedFormatCurrencyUnit.mockImplementation((_unit, value) => value.toString());
  });

  it("returns direct fiat values when preset amounts are available", () => {
    const mainAccount = createMockAccount({
      id: "main",
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const fiatCurrency = getFiatCurrencyByTicker("USD");
    const feePresetOptions = [
      { id: "slow", amount: new BigNumber(1) },
      { id: "fast", amount: new BigNumber(3) },
    ] satisfies readonly FeePresetOption[];
    const transaction = {
      family: "bitcoin",
      recipient: "bc1qrecipient",
      amount: new BigNumber(1),
      useAllAmount: false,
    } as Transaction;

    const { result } = renderHook(() =>
      useFeePresetFiatValues({
        account: mainAccount,
        parentAccount: null,
        mainAccount,
        transaction,
        feePresetOptions,
        counterValueCurrency: fiatCurrency,
        fiatUnit: fiatCurrency.units[0],
        enabled: true,
        shouldEstimateWithBridge: false,
      }),
    );

    expect(result.current).toEqual({
      slow: "1",
      fast: "3",
    });
  });

  it("estimates preset fiat values via bridge when using fallback preset ids (EVM)", async () => {
    const bridge = {
      updateTransaction: (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({
        ...tx,
        ...patch,
      }),
      prepareTransaction: async (_account: unknown, tx: Record<string, unknown>) => tx,
      getTransactionStatus: async (_account: unknown, tx: Record<string, unknown>) => {
        const feesByStrategy: Record<string, BigNumber> = {
          slow: new BigNumber(1),
          medium: new BigNumber(2),
          fast: new BigNumber(3),
        };
        const strategy = typeof tx.feesStrategy === "string" ? tx.feesStrategy : "";
        return { estimatedFees: feesByStrategy[strategy] ?? new BigNumber(0), errors: {} };
      },
    };
    mockedGetAccountBridge.mockReturnValue(bridge as never);

    const mainAccount = createMockAccount({
      id: "main",
      currency: getCryptoCurrencyById("ethereum"),
    });
    const fiatCurrency = getFiatCurrencyByTicker("USD");
    const transaction = {
      family: "evm",
      recipient: "0xrecipient",
      amount: new BigNumber(0),
      useAllAmount: false,
    } as Transaction;

    const { result } = renderHook(() =>
      useFeePresetFiatValues({
        account: mainAccount,
        parentAccount: null,
        mainAccount,
        transaction,
        feePresetOptions: [],
        fallbackPresetIds: ["slow", "medium", "fast"],
        counterValueCurrency: fiatCurrency,
        fiatUnit: fiatCurrency.units[0],
        enabled: true,
        shouldEstimateWithBridge: true,
      }),
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        slow: "1",
        medium: "2",
        fast: "3",
      });
    });
  });
});
