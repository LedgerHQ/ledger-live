/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { useFeePresetOptions } from "../useFeePresetOptions";

jest.mock("@ledgerhq/live-common/bridge/descriptor", () => ({
  sendFeatures: {
    getFeePresetOptions: jest.fn(() => []),
  },
}));

const mockedSendFeatures = jest.mocked(sendFeatures);

function createEvmTransaction(params: {
  gasLimit: BigNumber;
  gasOptions: Record<string, unknown>;
}): Transaction {
  return {
    family: "evm",
    type: 2,
    nonce: 1,
    chainId: 1,
    gasLimit: params.gasLimit,
    mode: "send",
    recipient: "0xrecipient",
    amount: new BigNumber(0),
    gasOptions: params.gasOptions,
  } as unknown as Transaction;
}

describe("useFeePresetOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes through the transaction as-is when not EVM", () => {
    const tx = { family: "bitcoin" } as unknown as Transaction;

    renderHook(() => useFeePresetOptions(undefined, tx));

    expect(mockedSendFeatures.getFeePresetOptions).toHaveBeenCalledWith(undefined, tx);
  });

  it("keeps the last distinct EVM gasOptions when current gasOptions are not distinct", () => {
    const distinctGasOptions = {
      slow: { maxFeePerGas: new BigNumber(1) },
      medium: { maxFeePerGas: new BigNumber(2) },
      fast: { maxFeePerGas: new BigNumber(3) },
    };
    const nonDistinctGasOptions = {
      slow: { maxFeePerGas: new BigNumber(1) },
      medium: { maxFeePerGas: new BigNumber(1) },
      fast: { maxFeePerGas: new BigNumber(1) },
    };

    const tx1 = createEvmTransaction({
      gasLimit: new BigNumber(21000),
      gasOptions: distinctGasOptions,
    });
    const tx2 = createEvmTransaction({
      gasLimit: new BigNumber(21000),
      gasOptions: nonDistinctGasOptions,
    });

    const { rerender } = renderHook(({ tx }) => useFeePresetOptions(undefined, tx), {
      initialProps: { tx: tx1 },
    });

    expect(mockedSendFeatures.getFeePresetOptions).toHaveBeenCalledTimes(1);
    const firstCallTx = mockedSendFeatures.getFeePresetOptions.mock.calls[0]?.[1] as Transaction;
    const firstCallTxWithGasOptions = firstCallTx as unknown as Transaction & {
      gasOptions: Record<string, unknown>;
    };
    expect(firstCallTxWithGasOptions.gasOptions).toBe(distinctGasOptions);

    rerender({ tx: tx2 });

    expect(mockedSendFeatures.getFeePresetOptions).toHaveBeenCalledTimes(2);
    const secondCallTx = mockedSendFeatures.getFeePresetOptions.mock.calls[1]?.[1] as Transaction;
    const secondCallTxWithGasOptions = secondCallTx as unknown as Transaction & {
      gasOptions: Record<string, unknown>;
    };
    expect(secondCallTxWithGasOptions.gasOptions).toBe(distinctGasOptions);
  });
});
