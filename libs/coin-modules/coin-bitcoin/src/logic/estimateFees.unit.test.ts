import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import { BTC_CHANGE, BTC_RECIPIENT, fakeExplorer } from "../test/fakeExplorer";
import { cryptoFor } from "./currency";
import { estimateFees } from "./estimateFees";
import type { BitcoinIntent } from "./intent";
import type { BitcoinFeeParameters } from "./types";

jest.mock("./replacement", () => ({
  ...jest.requireActual("./replacement"),
  getReplacementContext: jest.fn(),
}));
import { getReplacementContext } from "./replacement";
import { BigNumber } from "bignumber.js";

const crypto = cryptoFor("bitcoin");
const MODE = "Native SegWit" as const;

const intent = (
  overrides: Partial<BitcoinIntent> = {},
  data: Partial<BitcoinIntent["data"]> = {},
) =>
  ({
    intentType: "transaction",
    type: "send",
    sender: BTC_CHANGE,
    recipient: BTC_RECIPIENT,
    amount: 50_000n,
    asset: { type: "native" },
    ...overrides,
    data: { type: "bitcoin", derivationMode: MODE, ...data },
  }) as BitcoinIntent;

const input = { txid: "aa".repeat(32), vout: 0, value: "100000", address: BTC_CHANGE, path: "p" };
const params = (value: unknown) => value as BitcoinFeeParameters;

describe("estimateFees", () => {
  it("returns the presets and a one-input fee when no input is selected yet", async () => {
    const estimation = await estimateFees(fakeExplorer(), "bitcoin", intent(), {
      feesStrategy: "fast",
    });
    const scripts = [crypto.toOutputScript(BTC_RECIPIENT)];
    expect(estimation.value).toBe(BigInt(20 * maxTxVBytesCeil(1, scripts, true, crypto, MODE)));
    expect(params(estimation.parameters)).toMatchObject({
      feePerByte: 20n,
      feeRates: { slow: 5n, medium: 10n, fast: 20n },
      relayFeePerByte: 1n,
      inputs: [],
      outputs: [],
    });
  });

  it("prices the selected inputs", async () => {
    const estimation = await estimateFees(
      fakeExplorer(),
      "bitcoin",
      intent({}, { inputs: [input] }),
    );
    const scripts = [crypto.toOutputScript(BTC_RECIPIENT)];
    const fee = BigInt(10 * maxTxVBytesCeil(1, scripts, true, crypto, MODE));
    expect(estimation.value).toBe(fee);
    expect(params(estimation.parameters).inputs).toEqual([
      { txid: input.txid, vout: 0, value: 100_000n, address: BTC_CHANGE },
    ]);
    expect(params(estimation.parameters).outputs).toEqual([
      { address: BTC_RECIPIENT, value: 50_000n, isChange: false },
    ]);
    expect(params(estimation.parameters).amount).toBeUndefined();
  });

  it("gives the send-max amount, priced with the estimation recipient while it is being typed", async () => {
    const estimation = await estimateFees(
      fakeExplorer(),
      "bitcoin",
      intent({ recipient: "bc1q", useAllAmount: true, amount: 0n }, { inputs: [input] }),
    );
    expect(params(estimation.parameters).amount).toBe(100_000n - estimation.value);
  });

  it("stays usable when the selection does not cover the amount", async () => {
    const estimation = await estimateFees(
      fakeExplorer(),
      "bitcoin",
      intent({ amount: 1_000_000n }, { inputs: [input], opReturnData: "00ff" }),
    );
    const scripts = [
      crypto.toOutputScript(BTC_RECIPIENT),
      crypto.toOpReturnOutputScript(Buffer.from("00ff", "hex")),
    ];
    expect(estimation.value).toBe(BigInt(10 * maxTxVBytesCeil(1, scripts, true, crypto, MODE)));
    expect(params(estimation.parameters).inputs).toEqual([]);
  });

  it("reports nothing to send-max when nothing can be laid out", async () => {
    const estimation = await estimateFees(
      fakeExplorer(),
      "bitcoin",
      intent({ useAllAmount: true, amount: 0n }),
    );
    expect(params(estimation.parameters).amount).toBe(0n);
  });

  it("prefers the intent's custom rate and defaults a missing derivation mode to legacy", async () => {
    const estimation = await estimateFees(fakeExplorer(), "bitcoin", {
      ...intent(),
      data: { type: "bitcoin", feePerByte: "3" },
    } as BitcoinIntent);
    expect(params(estimation.parameters).feePerByte).toBe(3n);
    expect(estimation.value).toBe(
      BigInt(
        3 * maxTxVBytesCeil(1, [crypto.toOutputScript(BTC_RECIPIENT)], true, crypto, "Legacy"),
      ),
    );
  });

  it("describes the replaced transaction of a replacement", async () => {
    (getReplacementContext as jest.Mock).mockResolvedValue({
      original: {
        txid: "orig",
        vsize: 141,
        fee: 1_410n,
        feePerByte: new BigNumber(10),
        inputs: [{ txid: "prev", vout: 1, value: 100_000n, address: BTC_CHANGE, sequence: 0 }],
        outputs: [{ index: 0, address: BTC_RECIPIENT, value: 98_590n }],
      },
      originalFee: 1_410n,
      originalVsize: 141,
      incrementalFeePerByte: new BigNumber(1),
      minReplacementFee: 2_820n,
      minReplacementFeePerByte: new BigNumber(20),
    });
    const estimation = await estimateFees(
      fakeExplorer(),
      "bitcoin",
      intent({ type: "replace-speedup" }, { replacement: { txid: "orig" } }),
    );
    expect(params(estimation.parameters)).toMatchObject({
      minReplacementFee: 2_820n,
      originalFeePerByte: 10n,
      originalFee: 1_410n,
      minReplacementFeePerByte: 20n,
      replacedInputs: [{ txid: "prev", vout: 1, value: 100_000n, address: BTC_CHANGE }],
      replacedOutputs: [{ address: BTC_RECIPIENT, value: 98_590n }],
    });
  });
});
