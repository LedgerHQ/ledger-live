import type { Account } from "@ledgerhq/types-live";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { IExplorer } from "@ledgerhq/wallet-btc/explorer/types";
import BitcoinLikeStorage from "@ledgerhq/wallet-btc/storage/index";
import type { TX } from "@ledgerhq/wallet-btc/storage/types";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import Xpub from "@ledgerhq/wallet-btc/xpub";
import { getAddressesToWatch } from "./addressesToWatch";

const RECEIVE = 0;
const CHANGE = 1;
const xpubKey =
  "xpub6Co7wRMSsree1cGESqdgi4BpcVDgdJfjUWqY8M6Dnh3N1NmphcSwhbRoUA2nitgsJxd7gqhSTbSbXf3uAD4q4FqbCsKSGEpw5ab3DS7TtM2";
const crypto = cryptoFactory("zcash");
const derive = (chain: number, index: number) =>
  crypto.getAddress(DerivationModes.LEGACY, xpubKey, chain, index);
const deriveAll = (paths: [chain: number, index: number][]) =>
  Promise.all(paths.map(([chain, index]) => derive(chain, index)));
const block = { hash: "block", height: 1, time: "2026-01-01T00:00:00Z" };

type StoredTx = { chain: number; index: number; funded: boolean };

const makeTx = async ({ chain, index, funded }: StoredTx): Promise<TX> => {
  const address = await derive(chain, index);
  const id = `tx-${chain}-${index}`;
  return {
    id,
    account: chain,
    index,
    address,
    inputs: [],
    outputs: funded
      ? [{ value: "1000", address, output_hash: id, output_index: 0, block_height: 1, rbf: false }]
      : [],
    block,
    received_at: block.time,
  };
};

const makeAccount = async (txs: StoredTx[]): Promise<Account> => {
  const storage = new BitcoinLikeStorage();
  storage.appendTxs(jest.fn(), await Promise.all(txs.map(makeTx)));
  const xpub = new Xpub({
    storage,
    explorer: {} as IExplorer,
    crypto,
    xpub: xpubKey,
    derivationMode: DerivationModes.LEGACY,
  });
  const receiveIndexes = txs.filter(tx => tx.chain === RECEIVE).map(tx => tx.index);
  xpub.freshAddressIndex = Math.max(...receiveIndexes) + 1;
  return {
    freshAddress: await derive(RECEIVE, xpub.freshAddressIndex),
    bitcoinResources: { utxos: [], walletAccount: { xpub } },
  } as unknown as Account;
};

const used = (chain: number, count: number, fundedIndexes: number[]): StoredTx[] =>
  Array.from({ length: count }, (_, index) => ({
    chain,
    index,
    funded: fundedIndexes.includes(index),
  }));

describe("getAddressesToWatch", () => {
  it("returns the funded transparent addresses with the next receive and change addresses", async () => {
    const account = await makeAccount([...used(RECEIVE, 10, [3, 7]), ...used(CHANGE, 5, [2])]);

    expect((await getAddressesToWatch(account)).sort()).toEqual(
      (
        await deriveAll([
          [RECEIVE, 3],
          [RECEIVE, 7],
          [CHANGE, 2],
          [RECEIVE, 10],
          [CHANGE, 5],
        ])
      ).sort(),
    );
  });

  it("falls back to the fresh address when the wallet account is not loaded", async () => {
    const account = { freshAddress: "t1receive0", bitcoinResources: { utxos: [] } };

    expect(await getAddressesToWatch(account as unknown as Account)).toEqual(["t1receive0"]);
  });

  it("returns nothing for an account without any address", async () => {
    const account = { freshAddress: "" };

    expect(await getAddressesToWatch(account as unknown as Account)).toEqual([]);
  });
});
