import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { craftTransaction } from "./craftTransaction";
import { estimateFees } from "./estimateFees";

jest.mock("./craftTransaction", () => ({ craftTransaction: jest.fn() }));

const INTENT: TransactionIntent = {
  intentType: "transaction",
  type: "send",
  sender: "0x0fe6688548f0C303932bB197B0A96034f1d74dba",
  recipient: "0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86",
  amount: 1_000n,
  asset: { type: "native" },
};

describe("estimateFees", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("crafts the transaction and reads back the settled fee/gas parameters", async () => {
    jest.mocked(craftTransaction).mockResolvedValueOnce({
      transaction: "{}",
      details: { fee: "21000000", gas: 21000, maxFeePerGas: 1000, maxPriorityFeePerGas: 100 },
    });

    const fees = await estimateFees(INTENT);

    expect(craftTransaction).toHaveBeenCalledWith(INTENT, undefined);
    expect(fees).toEqual({
      value: 21000000n,
      parameters: { gas: 21000, maxFeePerGas: 1000, maxPriorityFeePerGas: 100 },
    });
  });

  it("forwards customFeesParameters to craftTransaction", async () => {
    jest.mocked(craftTransaction).mockResolvedValueOnce({
      transaction: "{}",
      details: { fee: "1", gas: 1, maxFeePerGas: 1, maxPriorityFeePerGas: 1 },
    });

    await estimateFees(INTENT, { gas: 30000 });

    expect(craftTransaction).toHaveBeenCalledWith(INTENT, {
      value: 0n,
      parameters: { gas: 30000 },
    });
  });

  it("defaults the fee to 0 when craftTransaction returns no details", async () => {
    jest.mocked(craftTransaction).mockResolvedValueOnce({ transaction: "{}" });

    const fees = await estimateFees(INTENT);

    expect(fees.value).toBe(0n);
  });

  it("propagates an error from craftTransaction", async () => {
    jest
      .mocked(craftTransaction)
      .mockRejectedValueOnce(new Error("vechain: recipient is required"));

    await expect(estimateFees(INTENT)).rejects.toThrow("vechain: recipient is required");
  });

  it("substitutes a 1-wei placeholder amount for a zero-amount pre-estimation", async () => {
    jest.mocked(craftTransaction).mockResolvedValueOnce({
      transaction: "{}",
      details: { fee: "21000000", gas: 21000, maxFeePerGas: 1000, maxPriorityFeePerGas: 100 },
    });

    await estimateFees({ ...INTENT, amount: 0n });

    expect(craftTransaction).toHaveBeenCalledWith({ ...INTENT, amount: 1n }, undefined);
  });

  it("does not substitute a placeholder when useAllAmount is set (craftTransaction resolves the balance)", async () => {
    jest.mocked(craftTransaction).mockResolvedValueOnce({
      transaction: "{}",
      details: { fee: "1", gas: 1, maxFeePerGas: 1, maxPriorityFeePerGas: 1 },
    });

    const maxIntent = { ...INTENT, amount: 0n, useAllAmount: true };
    await estimateFees(maxIntent);

    expect(craftTransaction).toHaveBeenCalledWith(maxIntent, undefined);
  });

  it("returns a zero estimate without crafting when the recipient is missing", async () => {
    const fees = await estimateFees({ ...INTENT, recipient: "" });

    expect(fees).toEqual({ value: 0n, parameters: {} });
    expect(craftTransaction).not.toHaveBeenCalled();
  });

  it("returns a zero estimate without crafting when the recipient is not a valid address", async () => {
    const fees = await estimateFees({ ...INTENT, recipient: "0xnot-an-address" });

    expect(fees).toEqual({ value: 0n, parameters: {} });
    expect(craftTransaction).not.toHaveBeenCalled();
  });
});
