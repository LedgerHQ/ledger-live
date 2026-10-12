import { BTC_RECIPIENT } from "../test/fakeExplorer";
import {
  explorerFor,
  feeInputs,
  intentData,
  isCancel,
  opReturnBuffer,
  recipientScript,
  shapeInputs,
  type BitcoinIntent,
} from "./intent";
import type { ReplacementContext } from "./replacement";
import type { BitcoinContext } from "./types";

const context = (config: Record<string, unknown> | Error): BitcoinContext => ({
  config: jest.fn(async () => {
    if (config instanceof Error) throw config;
    return config as never;
  }),
  logger: jest.fn(),
});

describe("explorerFor", () => {
  const endpoint = "https://explorers.example";

  it("uses the explorer id of the currency config", async () => {
    const explorer = await explorerFor(
      context({ explorerId: "btc" }),
      { explorerEndpoint: endpoint },
      "bitcoin",
    );
    expect(explorer.baseUrl).toBe(`${endpoint}/blockchain/v4/btc`);
  });

  it("lets the creator override it", async () => {
    const explorer = await explorerFor(
      context({ explorerId: "btc" }),
      { explorerEndpoint: endpoint, explorerId: "btc_regtest" },
      "bitcoin_regtest",
    );
    expect(explorer.baseUrl).toBe(`${endpoint}/blockchain/v4/btc_regtest`);
  });

  it("falls back to the currency id without config", async () => {
    const explorer = await explorerFor(
      context(new Error("no config")),
      { explorerEndpoint: endpoint },
      "litecoin",
    );
    expect(explorer.baseUrl).toBe(`${endpoint}/blockchain/v4/litecoin`);
    const empty = await explorerFor(context({}), { explorerEndpoint: endpoint }, "dash");
    expect(empty.baseUrl).toBe(`${endpoint}/blockchain/v4/dash`);
  });
});

const intent = (overrides: Partial<BitcoinIntent> = {}): BitcoinIntent =>
  ({
    intentType: "transaction",
    type: "send",
    sender: "",
    recipient: BTC_RECIPIENT,
    amount: 1n,
    asset: { type: "native" },
    ...overrides,
  }) as BitcoinIntent;

describe("intent helpers", () => {
  it("reads the bitcoin data, or an empty one", () => {
    expect(intentData(intent({ data: { type: "bitcoin", feePerByte: "2" } }))).toEqual({
      type: "bitcoin",
      feePerByte: "2",
    });
    expect(intentData(intent({ data: { type: "other" } as never }))).toEqual({ type: "bitcoin" });
    expect(intentData(intent())).toEqual({ type: "bitcoin" });
  });

  it("tells a cancel", () => {
    expect(isCancel(intent({ type: "replace-cancel" }))).toBe(true);
    expect(isCancel(intent())).toBe(false);
  });

  it("encodes a valid recipient only", () => {
    expect(recipientScript("bitcoin", BTC_RECIPIENT)?.length).toBe(22);
    expect(recipientScript("bitcoin", "")).toBeUndefined();
    expect(recipientScript("bitcoin", "nope")).toBeUndefined();
  });

  it("decodes the OP_RETURN payload", () => {
    expect(opReturnBuffer({ type: "bitcoin", opReturnData: "ab" })).toEqual(Buffer.from([0xab]));
    expect(opReturnBuffer({ type: "bitcoin" })).toBeUndefined();
  });

  it("reads the fee rate inputs, intent first", () => {
    expect(
      feeInputs(intent({ data: { type: "bitcoin", feePerByte: "4" }, feesStrategy: "slow" }), {
        feePerByte: "9",
        feesStrategy: "fast",
      }),
    ).toEqual({ feePerByte: "4", feesStrategy: "fast" });
    expect(feeInputs(intent({ feesStrategy: "slow" }))).toEqual({
      feePerByte: undefined,
      feesStrategy: "slow",
    });
  });
});

describe("shapeInputs", () => {
  const replacement = {
    original: {
      inputs: [{ txid: "a", vout: 1, value: 700n, address: null, sequence: 0 }],
    },
  } as unknown as ReplacementContext;

  it("takes the given values, or the replaced transaction's", () => {
    expect(
      shapeInputs(
        {
          type: "bitcoin",
          inputs: [
            { txid: "a", vout: 1, address: "x", path: "p" },
            { txid: "b", vout: 0, address: "y", path: "q", value: "5", blockHeight: 3 },
          ],
        },
        replacement,
      ),
    ).toEqual([
      { txid: "a", vout: 1, value: 700n, address: "x", path: "p", blockHeight: null },
      { txid: "b", vout: 0, value: 5n, address: "y", path: "q", blockHeight: 3 },
    ]);
    expect(shapeInputs({ type: "bitcoin" })).toEqual([]);
  });

  it("refuses an input whose value is unknown", () => {
    expect(() =>
      shapeInputs({ type: "bitcoin", inputs: [{ txid: "c", vout: 2, address: "z", path: "r" }] }),
    ).toThrow("Missing value of input c:2");
  });
});
