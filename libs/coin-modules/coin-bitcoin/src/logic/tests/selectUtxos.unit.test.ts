import type { ExplorerUtxo } from "../../network/types";
import {
  DerivationModes,
  cryptoFor,
  derivationModeOf,
  maxTxSizeCeil,
  selectUtxos,
} from "../selectUtxos";
import {
  FUNDED_P2PKH,
  FUNDED_P2WPKH,
  PRISTINE_P2PKH,
  PRISTINE_P2SH_P2WPKH,
  PRISTINE_P2TR,
} from "./helpers/fixtures";

const crypto = cryptoFor("bitcoin");
const recipientScript = crypto.toOutputScript(PRISTINE_P2PKH);
const mode = DerivationModes.NATIVE_SEGWIT;

/** An output; `height` `null` for an unconfirmed one. */
const utxo = (
  hash: string,
  value: bigint,
  outputIndex = 0,
  height: number | null = 1,
): ExplorerUtxo => ({
  hash: hash.repeat(64).slice(0, 64),
  outputIndex,
  value: value.toString(),
  hex: "",
  ...(height === null ? {} : { height }),
});

// Size of the transaction, from the bridge's size maths.
const vsize = (inputs: number, change: boolean, extra: Buffer[] = []) =>
  BigInt(maxTxSizeCeil(inputs, [recipientScript, ...extra], change, crypto, mode));

// Size one native SegWit input adds, as the bridge's maximum spendable computes it.
const INPUT_VSIZE = BigInt(
  maxTxSizeCeil(1, [], false, crypto, mode) - maxTxSizeCeil(0, [], false, crypto, mode),
);

const select = (
  utxos: ExplorerUtxo[],
  amount: bigint,
  useAllAmount = false,
  extraOutputScripts?: Buffer[],
  options: Partial<Parameters<typeof selectUtxos>[0]> = {},
) =>
  selectUtxos({
    utxos,
    amount,
    useAllAmount,
    recipientScript,
    crypto,
    derivationMode: mode,
    feePerByte: 10n,
    relayFeePerByte: 1n,
    ...(extraOutputScripts ? { extraOutputScripts } : {}),
    ...options,
  });

describe("derivationModeOf", () => {
  it.each([
    [FUNDED_P2PKH, DerivationModes.LEGACY],
    [PRISTINE_P2SH_P2WPKH, DerivationModes.SEGWIT],
    [FUNDED_P2WPKH, DerivationModes.NATIVE_SEGWIT],
    [PRISTINE_P2TR, DerivationModes.TAPROOT],
  ])("reads the type of %s", (address, expected) => {
    expect(derivationModeOf(crypto.toOutputScript(address))).toBe(expected);
  });

  it("rejects a script no account address has", () => {
    expect(() => derivationModeOf(Buffer.from("6a0100", "hex"))).toThrow(
      "unsupported sender address type",
    );
  });
});

describe("selectUtxos", () => {
  it("spends the deepest output first, as the bridge's default strategy, and returns the change", () => {
    const deep = utxo("a", 60_000n, 0, 100);
    const recent = utxo("b", 100_000n, 0, 200);
    const selection = select([recent, deep], 10_000n);
    const fee = vsize(1, true) * 10n;
    expect(selection).toEqual({
      inputs: [deep],
      fee,
      change: 60_000n - 10_000n - fee,
      amount: 10_000n,
      sufficient: true,
    });
  });

  it("spends unconfirmed outputs (own change) after every confirmed one", () => {
    const unconfirmed = utxo("a", 100_000n, 0, null);
    const confirmed = utxo("b", 60_000n, 0, 500);
    expect(select([unconfirmed, confirmed], 10_000n).inputs).toEqual([confirmed]);
  });

  it("adds outputs, deepest first, until the amount and the fee are covered", () => {
    const selection = select(
      [utxo("c", 8_000n, 0, 3), utxo("a", 6_000n, 0, 1), utxo("b", 7_000n, 0, 2)],
      13_000n,
    );
    expect(selection.inputs.map(input => input.value)).toEqual(["6000", "7000", "8000"]);
    expect(selection.sufficient).toBe(true);
    expect(selection.fee + selection.change + selection.amount).toBe(21_000n);
  });

  it("leaves change below the dust threshold to the fee", () => {
    const fee = vsize(1, false) * 10n;
    const selection = select([utxo("a", 10_000n + fee + 100n)], 10_000n);
    expect(selection.change).toBe(0n);
    expect(selection.fee).toBe(fee + 100n);
  });

  it("orders equal outputs by outpoint, so the selection is deterministic", () => {
    const first = select([utxo("b", 50_000n, 1), utxo("b", 50_000n, 0)], 1_000n);
    expect(first.inputs).toEqual([utxo("b", 50_000n, 0)]);
  });

  it("spends every output without change for useAllAmount", () => {
    const selection = select([utxo("b", 7_000n), utxo("a", 6_000n)], 0n, true);
    const fee = vsize(2, false) * 10n;
    expect(selection).toEqual({
      inputs: [utxo("a", 6_000n), utxo("b", 7_000n)],
      fee,
      change: 0n,
      amount: 13_000n - fee,
      sufficient: true,
    });
  });

  it("leaves out of useAllAmount the outputs worth no more than their own input's fee", () => {
    // As the bridge's maximum spendable: an output pays for itself only above rate × input size.
    const costToSpend = 10n * INPUT_VSIZE;
    const selection = select(
      [utxo("a", 6_000n), utxo("b", costToSpend), utxo("c", costToSpend + 1n)],
      0n,
      true,
    );
    expect(selection.inputs.map(input => input.value)).toEqual(["6000", String(costToSpend + 1n)]);
    expect(selection.amount).toBe(6_000n + costToSpend + 1n - vsize(2, false) * 10n);
  });

  it("refuses a useAllAmount from an address holding only outputs not worth spending", () => {
    const selection = select([utxo("a", 10n * INPUT_VSIZE)], 0n, true);
    expect(selection.inputs).toEqual([]);
    expect(selection.sufficient).toBe(false);
  });

  it("prices the OP_RETURN output the transaction pays", () => {
    const opReturn = crypto.toOpReturnOutputScript(Buffer.from("swap memo"));
    const plain = select([utxo("a", 100_000n)], 10_000n);
    const withData = select([utxo("a", 100_000n)], 10_000n, false, [opReturn]);
    expect(withData.fee).toBe(vsize(1, true, [opReturn]) * 10n);
    expect(withData.fee).toBeGreaterThan(plain.fee);
  });

  it("reports insufficient funds with the fee of spending everything", () => {
    const selection = select([utxo("a", 1_000n)], 10_000n);
    expect(selection.sufficient).toBe(false);
    expect(selection.fee).toBe(vsize(1, true) * 10n);
  });

  it("prices a one-input transaction for an address without outputs", () => {
    expect(select([], 1_000n).fee).toBe(vsize(1, true) * 10n);
  });
});

describe("selectUtxos strategies", () => {
  const deep = utxo("a", 50_000n, 0, 1);
  const small = utxo("b", 5_000n, 0, 2);
  const medium = utxo("c", 9_000n, 0, 3);
  const set = [medium, deep, small];

  it("deep-outputs-first without any option is the default selection", () => {
    expect(select(set, 10_000n, false, undefined, { strategy: "deep-outputs-first" })).toEqual(
      select(set, 10_000n),
    );
    expect(select(set, 10_000n, false, undefined, { selected: [] }).inputs).toEqual([deep]);
  });

  it("merge-outputs spends the smallest outputs first", () => {
    const selection = select(set, 10_000n, false, undefined, { strategy: "merge-outputs" });
    expect(selection.inputs).toEqual([small, medium]);
    expect(selection.sufficient).toBe(true);
  });

  it("merge-outputs orders equal values by outpoint", () => {
    const selection = select(
      [utxo("e", 5_000n, 1), utxo("e", 5_000n, 0), utxo("f", 90_000n)],
      3_000n,
      false,
      undefined,
      { strategy: "merge-outputs" },
    );
    expect(selection.inputs).toEqual([utxo("e", 5_000n, 0)]);
  });

  describe("optimize-size", () => {
    const strategy = "optimize-size" as const;

    it("finds the exact match without change that deepest first misses", () => {
      const exact = utxo("e", 10_000n + vsize(1, false) * 10n, 0, 9);
      const selection = select([deep, exact], 10_000n, false, undefined, { strategy });
      expect(selection).toEqual({
        inputs: [exact],
        fee: vsize(1, false) * 10n,
        change: 0n,
        amount: 10_000n,
        sufficient: true,
      });
      expect(select([deep, exact], 10_000n).inputs).toEqual([deep]);
    });

    it("prefers fewer inputs to many small ones", () => {
      const selection = select([small, medium, deep], 8_000n, false, undefined, { strategy });
      expect(selection.inputs.length).toBe(1);
      expect(selection.sufficient).toBe(true);
    });

    it("is deterministic whatever the order of the candidates", () => {
      const forward = select(set, 10_000n, false, undefined, { strategy });
      const reversed = select([...set].reverse(), 10_000n, false, undefined, { strategy });
      expect(reversed).toEqual(forward);
    });

    it("falls back to deepest first when the search finds nothing", () => {
      const poor = [utxo("a", 6_000n, 0, 1), utxo("b", 7_000n, 0, 2)];
      const selection = select(poor, 13_000n, false, undefined, { strategy });
      expect(selection.sufficient).toBe(false);
      expect(selection).toEqual(select(poor, 13_000n));
    });
  });

  describe("with selected outputs", () => {
    it("spends exactly the selected outputs ", () => {
      const selection = select([deep, medium], 3_000n, false, undefined, { selected: [small] });
      const fee = vsize(1, false) * 10n;
      expect(selection.inputs).toEqual([small]);
      expect(selection.sufficient).toBe(true);
      expect(selection.fee + selection.change + selection.amount).toBe(5_000n);
      expect(selection.fee).toBeGreaterThanOrEqual(fee);
    });

    it("is insufficient when the selection does not cover amount and fee", () => {
      const selection = select([deep], 10_000n, false, undefined, { selected: [small] });
      expect(selection.inputs).toEqual([small]);
      expect(selection.sufficient).toBe(false);
    });

    it("ignores the strategy and the candidates", () => {
      const options = { selected: [small, medium] };
      for (const strategy of ["deep-outputs-first", "merge-outputs", "optimize-size"] as const) {
        expect(select([deep], 10_000n, false, undefined, { ...options, strategy }).inputs).toEqual([
          small,
          medium,
        ]);
      }
    });

    it("sweeps exactly the selected outputs, even one not worth its own input's fee", () => {
      const costToSpend = 10n * INPUT_VSIZE;
      const tiny = utxo("d", costToSpend);
      const selection = select([utxo("e", 80_000n)], 0n, true, undefined, {
        selected: [tiny, utxo("a", 6_000n)],
      });
      expect(selection.inputs).toEqual([utxo("a", 6_000n), tiny]);
      expect(selection.amount).toBe(6_000n + costToSpend - vsize(2, false) * 10n);
    });
  });
});
