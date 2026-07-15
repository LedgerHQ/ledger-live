import { BigNumber } from "bignumber.js";
import { syncGasOptionsEffect } from "./effects";

type FlowEffectContextArg = Parameters<typeof syncGasOptionsEffect.run>[0];

function buildContext(
  preparedPatch: Record<string, unknown>,
): FlowEffectContextArg & { prepareTransaction: jest.Mock } {
  const transaction = { family: "evm", recipient: "0x0", amount: new BigNumber(0) };
  const prepared = { ...transaction, ...preparedPatch };
  const prepareTransaction = jest.fn().mockResolvedValue(prepared);
  return {
    account: { id: "acc", type: "Account" } as unknown as FlowEffectContextArg["account"],
    parentAccount: null,
    transaction: transaction as unknown as FlowEffectContextArg["transaction"],
    bridge: { prepareTransaction } as unknown as FlowEffectContextArg["bridge"],
    prepareTransaction,
  };
}

describe("syncGasOptionsEffect", () => {
  it("returns a gasOptions patch when slow/medium/fast hold distinct fee rates", async () => {
    const gasOptions = {
      slow: { maxFeePerGas: new BigNumber(20) },
      medium: { maxFeePerGas: new BigNumber(24) },
      fast: { maxFeePerGas: new BigNumber(30) },
    };
    const ctx = buildContext({ gasOptions });

    const patch = await syncGasOptionsEffect.run(ctx);

    expect(patch).toEqual({ gasOptions });
    expect(ctx.prepareTransaction).toHaveBeenCalledTimes(1);
  });

  it("falls back to gasPrice when maxFeePerGas is missing", async () => {
    const gasOptions = {
      slow: { gasPrice: new BigNumber(10) },
      medium: { gasPrice: new BigNumber(12) },
      fast: { gasPrice: new BigNumber(15) },
    };
    const ctx = buildContext({ gasOptions });

    const patch = await syncGasOptionsEffect.run(ctx);

    expect(patch).toEqual({ gasOptions });
  });

  it("returns null when all strategies share the same fee rate", async () => {
    const ctx = buildContext({
      gasOptions: {
        slow: { maxFeePerGas: new BigNumber(20) },
        medium: { maxFeePerGas: new BigNumber(20) },
        fast: { maxFeePerGas: new BigNumber(20) },
      },
    });

    expect(await syncGasOptionsEffect.run(ctx)).toBeNull();
  });

  it("returns null when prepared transaction has no gasOptions", async () => {
    const ctx = buildContext({});
    expect(await syncGasOptionsEffect.run(ctx)).toBeNull();
  });

  it("returns null when fewer than 2 strategies expose a readable fee", async () => {
    const ctx = buildContext({
      gasOptions: {
        slow: { maxFeePerGas: new BigNumber(20) },
        medium: {},
        fast: {},
      },
    });

    expect(await syncGasOptionsEffect.run(ctx)).toBeNull();
  });

  it("returns null when gasOptions is not an object", async () => {
    const ctx = buildContext({ gasOptions: "not-an-object" });
    expect(await syncGasOptionsEffect.run(ctx)).toBeNull();
  });
});
