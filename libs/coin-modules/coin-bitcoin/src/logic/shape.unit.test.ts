import { BigNumber } from "bignumber.js";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import { BTC_CHANGE, BTC_RECIPIENT } from "../test/fakeExplorer";
import { cryptoFor } from "./currency";
import type { ReplacementContext } from "./replacement";
import { computeShape, type ShapeInput, type ShapeParams } from "./shape";

const crypto = cryptoFor("bitcoin");
const MODE = "Native SegWit" as const;

const input = (txid: string, value: bigint): ShapeInput => ({
  txid,
  vout: 0,
  value,
  address: BTC_CHANGE,
  path: "84'/0'/0'/0/0",
  blockHeight: 1,
});

const params = (overrides: Partial<ShapeParams> = {}): ShapeParams => ({
  crypto,
  derivationMode: MODE,
  inputs: [input("a", 100_000n)],
  recipient: BTC_RECIPIENT,
  amount: 50_000n,
  useAllAmount: false,
  change: { address: BTC_CHANGE },
  feePerByte: new BigNumber(10),
  ...overrides,
});

const recipientScript = crypto.toOutputScript(BTC_RECIPIENT);
const vbytes = (inputs: number, withChange: boolean, scripts = [recipientScript]) =>
  BigInt(maxTxVBytesCeil(inputs, scripts, withChange, crypto, MODE));

describe("computeShape", () => {
  it("adds a change output when what is left is above the dust limit", () => {
    const shape = computeShape(params());
    const fee = 10n * vbytes(1, true);
    expect(shape.fee).toBe(fee);
    expect(shape.outputs).toHaveLength(2);
    expect(shape.outputs[1]).toMatchObject({ address: BTC_CHANGE, isChange: true });
    expect(shape.outputs[1].value).toBe(100_000n - 50_000n - fee);
    expect(shape.amount).toBe(50_000n);
  });

  it("gives what is left to the fee when it is below the dust limit", () => {
    const fee = 10n * vbytes(1, true);
    const shape = computeShape(params({ amount: 100_000n - fee - 100n }));
    expect(shape.outputs).toHaveLength(1);
    expect(shape.fee).toBe(fee + 100n);
  });

  it("spends everything on send-max, without change", () => {
    const shape = computeShape(
      params({ inputs: [input("a", 60_000n), input("b", 40_000n)], useAllAmount: true }),
    );
    const fee = 10n * vbytes(2, false);
    expect(shape.outputs).toHaveLength(1);
    expect(shape.fee).toBe(fee);
    expect(shape.amount).toBe(100_000n - fee);
  });

  it("refuses inputs that do not cover the amount and the fee", () => {
    expect(() => computeShape(params({ amount: 99_999n }))).toThrow(NotEnoughBalance);
    expect(() => computeShape(params({ inputs: [] }))).toThrow(NotEnoughBalance);
  });

  it("puts the OP_RETURN output first", () => {
    const shape = computeShape(params({ opReturnData: Buffer.from("hello") }));
    expect(shape.outputs[0]).toMatchObject({ address: null, value: 0n, isChange: false });
    expect(shape.outputs[1].address).toBe(BTC_RECIPIENT);
  });

  it("splits an amount larger than what bitcoinjs serializes", () => {
    const max = BigInt(Number.MAX_SAFE_INTEGER);
    const shape = computeShape(
      params({ inputs: [input("a", max * 3n)], amount: max * 2n + 1n, change: undefined }),
    );
    const recipientOutputs = shape.outputs.filter(o => o.address === BTC_RECIPIENT);
    expect(recipientOutputs.map(o => o.value)).toEqual([max, max, 1n]);
    expect(shape.amount).toBe(max * 2n + 1n);
  });

  describe("replacement", () => {
    const replacement = (overrides: Partial<ReplacementContext> = {}): ReplacementContext => ({
      original: {
        txid: "original",
        vsize: 141,
        fee: 1_410n,
        feePerByte: new BigNumber(10),
        inputs: [],
        outputs: [],
      },
      originalFee: 1_410n,
      originalVsize: 141,
      incrementalFeePerByte: new BigNumber(1),
      minReplacementFee: 2_820n,
      minReplacementFeePerByte: new BigNumber(20),
      ...overrides,
    });

    it("pays at least the minimum replacement fee", () => {
      const shape = computeShape(
        params({ feePerByte: new BigNumber(1), replacement: replacement() }),
      );
      expect(shape.fee).toBe(2_820n);
    });

    it("reduces the change to reach the absolute fee increase", () => {
      const shape = computeShape(
        params({
          feePerByte: new BigNumber(1),
          replacement: replacement({ minReplacementFee: 0n, originalFee: 5_000n }),
        }),
      );
      expect(shape.fee).toBe(5_000n + 141n);
    });

    it("cannot reach the fee increase without an output of the account to reduce", () => {
      expect(() =>
        computeShape(
          params({
            useAllAmount: true,
            change: undefined,
            replacement: replacement({ minReplacementFee: 0n, originalFee: 90_000n }),
          }),
        ),
      ).toThrow(/no change output to reduce/);
    });
  });
});
