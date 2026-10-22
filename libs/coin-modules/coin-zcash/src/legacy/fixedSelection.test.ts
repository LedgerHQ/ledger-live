import { BigNumber } from "bignumber.js";
import type { ICrypto } from "@ledgerhq/wallet-btc/crypto/types";
import type Xpub from "@ledgerhq/wallet-btc/xpub";
import { ZcashPreparedBuildMismatch } from "../types/errors";
import { FixedSelection } from "./fixedSelection";

const logger = jest.fn();
const utxo = (hash: string, index: number, value: string) => ({
  output_hash: hash,
  output_index: index,
  value,
  address: `addr-${hash}`,
});
const STORED = [utxo("a", 0, "30000"), utxo("b", 1, "20000"), utxo("c", 0, "50000")];

const xpub = {
  getXpubAddresses: async () => ["addr0", "addr1"],
  storage: {
    getAddressUnspentUtxos: (address: string) => (address === "addr0" ? STORED : []),
  },
} as unknown as Xpub;

const select = (
  outpoints: { hash: string; outputIndex: number }[],
  excluded: { hash: string; outputIndex: number }[] = [],
  fee = new BigNumber(15_000),
  change = true,
) => {
  const strategy = new FixedSelection({} as ICrypto, "", outpoints, fee, change);
  strategy.excludedUTXOs.push(...excluded);
  return strategy.selectUnspentUtxosToUse(logger, xpub, [], 1);
};

describe("FixedSelection", () => {
  it("returns exactly the requested outpoints, in the requested order, with their total", async () => {
    const result = await select([
      { hash: "c", outputIndex: 0 },
      { hash: "a", outputIndex: 0 },
    ]);

    expect(result.unspentUtxos.map(u => u.output_hash)).toEqual(["c", "a"]);
    expect(result.totalValue.toNumber()).toBe(80_000);
  });

  it("returns the given fee and change flag unchanged", async () => {
    const withChange = await select([{ hash: "a", outputIndex: 0 }]);
    const without = await select([{ hash: "a", outputIndex: 0 }], [], new BigNumber(10_000), false);

    expect(withChange).toMatchObject({ fee: 15_000, needChangeoutput: true });
    expect(without).toMatchObject({ fee: 10_000, needChangeoutput: false });
  });

  it("refuses when an outpoint is absent from storage", async () => {
    await expect(select([{ hash: "zzz", outputIndex: 0 }])).rejects.toBeInstanceOf(
      ZcashPreparedBuildMismatch,
    );
  });

  it("refuses when an outpoint was excluded as unusable", async () => {
    await expect(
      select([{ hash: "b", outputIndex: 1 }], [{ hash: "b", outputIndex: 1 }]),
    ).rejects.toBeInstanceOf(ZcashPreparedBuildMismatch);
  });
});
