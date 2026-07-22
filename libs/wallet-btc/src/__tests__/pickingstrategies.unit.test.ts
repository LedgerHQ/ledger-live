import BigNumber from "bignumber.js";
import coininfo from "coininfo";
import { NotEnoughBalance } from "@ledgerhq/errors";
import Bitcoin from "../crypto/bitcoin";
import { Merge } from "../pickingstrategies/Merge";
import { DeepFirst } from "../pickingstrategies/DeepFirst";
import { CoinSelect } from "../pickingstrategies/CoinSelect";
import { DerivationModes } from "../types";
import type { OutputInfo } from "..";
import type { Output } from "../storage/types";

const network = coininfo.bitcoin.main.toBitcoinJS();
const crypto = new Bitcoin({ network });
const RECIPIENT = "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2";

const makeUtxo = (
  output_hash: string,
  output_index: number,
  value: number,
  block_height: number,
): Output =>
  ({
    output_hash,
    output_index,
    value: String(value),
    address: "1AddrOwnedByXpub00000000000000000",
    block_height,
    rbf: false,
  }) as unknown as Output;

const makeXpub = (utxos: Output[]) =>
  ({
    getXpubAddresses: jest.fn().mockResolvedValue([{ address: "addr", account: 0, index: 0 }]),
    storage: { getAddressUnspentUtxos: jest.fn().mockResolvedValue(utxos) },
  }) as any;

const outputsFor = (value: number): OutputInfo[] => [
  {
    script: crypto.toOutputScript(RECIPIENT),
    value: new BigNumber(value),
    address: RECIPIENT,
    isChange: false,
  },
];

describe.each([
  ["Merge", Merge],
  ["DeepFirst", DeepFirst],
])("%s picking strategy", (_name, Strategy) => {
  it("selects enough UTXOs to cover amount + fee and flags change", async () => {
    const utxos = [
      makeUtxo("h1", 0, 10000, 100),
      makeUtxo("h2", 0, 20000, 101),
      makeUtxo("h3", 0, 30000, 102),
      makeUtxo("h4", 0, 50000, 103),
    ];
    const strat = new Strategy(crypto, DerivationModes.LEGACY, []);
    const res = await strat.selectUnspentUtxosToUse(makeXpub(utxos), outputsFor(60000), 5);

    expect(res.unspentUtxos.length).toBeGreaterThan(0);
    expect(res.totalValue.gte(60000)).toBe(true);
    expect(res.fee).toBeGreaterThan(0);
    expect(typeof res.needChangeoutput).toBe("boolean");
  });

  it("throws NotEnoughBalance when UTXOs cannot cover amount + fee", async () => {
    const utxos = [makeUtxo("h1", 0, 1000, 100), makeUtxo("h2", 0, 2000, 101)];
    const strat = new Strategy(crypto, DerivationModes.LEGACY, []);
    await expect(
      strat.selectUnspentUtxosToUse(makeXpub(utxos), outputsFor(100000), 5),
    ).rejects.toBeInstanceOf(NotEnoughBalance);
  });

  it("excludes UTXOs listed in excludedUTXOs", async () => {
    const utxos = [makeUtxo("h1", 0, 100000, 100), makeUtxo("excluded", 3, 100000, 101)];
    const strat = new Strategy(crypto, DerivationModes.LEGACY, [
      { hash: "excluded", outputIndex: 3 },
    ]);
    const res = await strat.selectUnspentUtxosToUse(makeXpub(utxos), outputsFor(50000), 5);
    expect(res.unspentUtxos.some(u => u.output_hash === "excluded")).toBe(false);
  });
});

describe("Merge vs DeepFirst selection order", () => {
  const utxos = [
    makeUtxo("small-new", 0, 20000, 900), // small value, newest block
    makeUtxo("large-old", 0, 90000, 100), // large value, oldest block
  ];

  it("Merge prefers the smaller-value UTXO first", async () => {
    const res = await new Merge(crypto, DerivationModes.LEGACY, []).selectUnspentUtxosToUse(
      makeXpub(utxos),
      outputsFor(10000),
      1,
    );
    expect(res.unspentUtxos[0].output_hash).toBe("small-new");
  });

  it("DeepFirst prefers the oldest (lowest block_height) UTXO first", async () => {
    const res = await new DeepFirst(crypto, DerivationModes.LEGACY, []).selectUnspentUtxosToUse(
      makeXpub(utxos),
      outputsFor(10000),
      1,
    );
    expect(res.unspentUtxos[0].output_hash).toBe("large-old");
  });
});

describe("CoinSelect picking strategy", () => {
  it("returns a covering selection on the happy path", async () => {
    const utxos = [
      makeUtxo("h1", 0, 30000, 100),
      makeUtxo("h2", 0, 40000, 101),
      makeUtxo("h3", 0, 60000, 102),
    ];
    const res = await new CoinSelect(crypto, DerivationModes.LEGACY, []).selectUnspentUtxosToUse(
      makeXpub(utxos),
      outputsFor(50000),
      5,
    );
    expect(res.unspentUtxos.length).toBeGreaterThan(0);
    expect(res.totalValue.gte(50000)).toBe(true);
    expect(res.fee).toBeGreaterThan(0);
  });

  it("throws NotEnoughBalance when balance is insufficient", async () => {
    const utxos = [makeUtxo("h1", 0, 1000, 100)];
    await expect(
      new CoinSelect(crypto, DerivationModes.LEGACY, []).selectUnspentUtxosToUse(
        makeXpub(utxos),
        outputsFor(100000),
        5,
      ),
    ).rejects.toBeInstanceOf(NotEnoughBalance);
  });
});
