import { createApi } from "./index";
import * as logic from "../logic";

jest.mock("../logic", () => ({
  ...jest.requireActual("../logic"),
  craftTransaction: jest.fn(),
  combine: jest.fn(),
  broadcast: jest.fn(),
  getBalance: jest.fn(),
  listOperations: jest.fn(),
  lastBlock: jest.fn(),
  validateAddress: jest.fn(),
}));

describe("api/createApi", () => {
  const api = createApi({ info: {} as never });

  it("returns a CoinModuleApi with every required method", () => {
    expect(typeof api.craftTransaction).toBe("function");
    expect(typeof api.estimateFees).toBe("function");
    expect(typeof api.combine).toBe("function");
    expect(typeof api.broadcast).toBe("function");
    expect(typeof api.getBalance).toBe("function");
    expect(typeof api.listOperations).toBe("function");
    expect(typeof api.lastBlock).toBe("function");
    expect(typeof api.validateAddress).toBe("function");
    expect(typeof api.craftTransactionData).toBe("function");
  });

  it("craftTransaction delegates to logic.craftTransaction (happy path)", async () => {
    (logic.craftTransaction as jest.Mock).mockResolvedValue({
      pcztHex: "aa",
      pcztTransaction: {},
      feeZat: "10000",
      anchorHeight: 1,
      nActionsOrchard: 0,
      nTransparentInputs: 0,
      nTransparentOutputs: 1,
    });

    const result = await api.craftTransaction({
      intentType: "transaction",
      type: "send",
      sender: "t1sender",
      recipient: "t1recipient",
      amount: 1000n,
      asset: { type: "native" },
    });

    expect(logic.craftTransaction).toHaveBeenCalled();
    expect(result.transaction).toBe("aa");
  });

  it("craftTransaction propagates errors from logic.craftTransaction (error path)", async () => {
    (logic.craftTransaction as jest.Mock).mockRejectedValue(new Error("engine unavailable"));

    await expect(
      api.craftTransaction({
        intentType: "transaction",
        type: "send",
        sender: "t1sender",
        recipient: "t1recipient",
        amount: 1000n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("engine unavailable");
  });

  it("combine delegates to logic.combine and returns the finalized tx hex", async () => {
    (logic.combine as jest.Mock).mockResolvedValue({ txHex: "deadbeef", txid: "abcd" });

    const result = await api.combine("pczt-hex", "sig-hex");
    expect(logic.combine).toHaveBeenCalledWith({
      pczt: "pczt-hex",
      orchardSignatures: ["sig-hex"],
      transparentSignatures: [],
    });
    expect(result).toBe("deadbeef");
  });

  it("combine propagates errors from logic.combine (error path)", async () => {
    (logic.combine as jest.Mock).mockRejectedValue(new Error("finalize failed"));
    await expect(api.combine("pczt-hex", "sig-hex")).rejects.toThrow("finalize failed");
  });

  it("broadcast delegates to logic.broadcast", async () => {
    (logic.broadcast as jest.Mock).mockResolvedValue("txid123");
    await expect(api.broadcast("tx-hex")).resolves.toBe("txid123");
    expect(logic.broadcast).toHaveBeenCalledWith("tx-hex");
  });

  it.each([
    ["call", () => api.call({})],
    ["craftRawTransaction", () => api.craftRawTransaction("tx", "sender", "pub", 0n)],
    ["getBlock", () => api.getBlock(1)],
    ["getBlockInfo", () => api.getBlockInfo(1)],
    ["getStakes", () => api.getStakes("addr")],
    ["getRewards", () => api.getRewards("addr")],
    ["getValidators", () => api.getValidators()],
    [
      "validateIntent",
      () =>
        api.validateIntent(
          {
            intentType: "transaction",
            type: "send",
            sender: "a",
            recipient: "b",
            amount: 1n,
            asset: { type: "native" },
          },
          [],
        ),
    ],
    ["getNextSequence", () => api.getNextSequence("addr")],
  ])("%s throws not supported", async (_name, fn) => {
    // Some methods throw synchronously despite their Promise-returning
    // signature; normalize both sync-throw and async-reject into one
    // rejected-promise assertion.
    await expect(Promise.resolve().then(fn)).rejects.toThrow(/not supported/);
  });
});
