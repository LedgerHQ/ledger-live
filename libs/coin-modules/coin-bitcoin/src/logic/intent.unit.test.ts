import { BTC_RECIPIENT } from "../test/fakeExplorer";
import {
  derivationModeOf,
  explorerFor,
  feeInputs,
  intentData,
  isCancel,
  opReturnBuffer,
  recipientScript,
  shapeInputs,
  type BitcoinIntent,
  withNormalizedRecipient,
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
  const url = "https://explorers.example";

  it("reads the explorer of the currency's coin config", async () => {
    const explorer = await explorerFor(
      context({
        explorerId: "btc",
        explorer: { url, batchSize: 50 },
        fees: { feeRatesCacheTtlMs: 7 },
      }),
      "bitcoin",
    );
    expect(explorer).toMatchObject({
      baseUrl: `${url}/blockchain/v4/btc`,
      batchSize: 50,
      feeRatesCacheTtlMs: 7,
    });
  });

  it("falls back to the currency id and the module defaults", async () => {
    const explorer = await explorerFor(context({ explorer: { url } }), "litecoin");
    expect(explorer).toMatchObject({
      baseUrl: `${url}/blockchain/v4/litecoin`,
      batchSize: 1000,
      feeRatesCacheTtlMs: 300_000,
    });
  });

  it("needs the coin config: it names the explorer", async () => {
    await expect(explorerFor(context(new Error("no config")), "dash")).rejects.toThrow("no config");
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

  it("reads the derivation mode in either naming, Legacy when absent", () => {
    expect(derivationModeOf({ type: "bitcoin", derivationMode: "native_segwit" })).toBe(
      "Native SegWit",
    );
    expect(derivationModeOf({ type: "bitcoin", derivationMode: "Taproot" })).toBe("Taproot");
    expect(derivationModeOf({ type: "bitcoin" })).toBe("Legacy");
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

describe("withNormalizedRecipient", () => {
  it("lowercases a bech32 recipient typed in uppercase", () => {
    const intent = { recipient: "BC1QAR0SRRR7XFKVY5L643LYDNW9RE59GTZZWF5MDQ", amount: 1n };
    expect(withNormalizedRecipient(intent)).toEqual({
      recipient: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
      amount: 1n,
    });
  });

  it("keeps any other recipient as given", () => {
    const lowercase = { recipient: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" };
    const legacy = { recipient: "1BKWjmA9swxRKMH9NgXpSz8YZfVMnWWU9D" };
    expect(withNormalizedRecipient(lowercase)).toBe(lowercase);
    expect(withNormalizedRecipient(legacy)).toBe(legacy);
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
