/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useStableGasOptions } from "../useStableGasOptions";

function createEvmTransaction(params: { gasOptions?: Record<string, unknown> }): Transaction {
  return {
    family: "evm",
    type: 2,
    nonce: 1,
    chainId: 1,
    gasLimit: new BigNumber(21000),
    mode: "send",
    recipient: "0xrecipient",
    amount: new BigNumber(0),
    ...(params.gasOptions ? { gasOptions: params.gasOptions } : {}),
  } as unknown as Transaction;
}

describe("useStableGasOptions", () => {
  it("returns the transaction unchanged when gasOptions is present", () => {
    const gasOptions = { medium: { maxFeePerGas: new BigNumber(1) } };
    const tx = createEvmTransaction({ gasOptions });

    const { result } = renderHook(() => useStableGasOptions(tx));

    expect(result.current).toBe(tx);
  });

  it("preserves the last non-null gasOptions across renders", () => {
    const gasOptions = { medium: { maxFeePerGas: new BigNumber(1) } };
    const tx1 = createEvmTransaction({ gasOptions });
    const tx2 = createEvmTransaction({ gasOptions: undefined });

    const { result, rerender } = renderHook(({ tx }) => useStableGasOptions(tx), {
      initialProps: { tx: tx1 },
    });

    const txWithGasOptions = result.current as Transaction & { gasOptions?: unknown };
    expect("gasOptions" in result.current && txWithGasOptions.gasOptions).toBe(gasOptions);

    rerender({ tx: tx2 });

    const txWithGasOptionsAfterRerender = result.current as Transaction & { gasOptions?: unknown };
    expect("gasOptions" in result.current && txWithGasOptionsAfterRerender.gasOptions).toBe(
      gasOptions,
    );
  });
});
