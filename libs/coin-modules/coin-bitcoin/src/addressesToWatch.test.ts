import range from "lodash/range";
import type { Account } from "@ledgerhq/types-live";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { IExplorer } from "@ledgerhq/wallet-btc/explorer/types";
import BitcoinLikeStorage from "@ledgerhq/wallet-btc/storage/index";
import type { Input, Output, TX } from "@ledgerhq/wallet-btc/storage/types";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import Xpub from "@ledgerhq/wallet-btc/xpub";
import { getAddressesToWatch } from "./addressesToWatch";

const RECEIVE = 0;
const CHANGE = 1;
const xpubKey =
  "xpub6Co7wRMSsree1cGESqdgi4BpcVDgdJfjUWqY8M6Dnh3N1NmphcSwhbRoUA2nitgsJxd7gqhSTbSbXf3uAD4q4FqbCsKSGEpw5ab3DS7TtM2";
const crypto = cryptoFactory("bitcoin");
const derive = (chain: number, index: number) =>
  crypto.getAddress(DerivationModes.NATIVE_SEGWIT, xpubKey, chain, index);
const deriveAll = (chain: number, indexes: number[]) =>
  Promise.all(indexes.map(index => derive(chain, index)));
const block = { hash: "block", height: 1, time: "2026-01-01T00:00:00Z" };

type StoredTx = {
  chain: number;
  index: number;
  id?: string;
  outputValue?: string;
  spends?: { chain: number; index: number; id: string };
  pending?: boolean;
};

const makeTx = async ({
  chain,
  index,
  id,
  outputValue,
  spends,
  pending,
}: StoredTx): Promise<TX> => {
  const address = await derive(chain, index);
  const txId = id ?? `tx-${chain}-${index}`;
  const outputs: Output[] = outputValue
    ? [
        {
          value: outputValue,
          address,
          output_hash: txId,
          output_index: 0,
          block_height: 1,
          rbf: false,
        },
      ]
    : [];
  const inputs: Input[] = spends
    ? [
        {
          value: "1000",
          address: await derive(spends.chain, spends.index),
          output_hash: spends.id,
          output_index: 0,
          sequence: 0,
        },
      ]
    : [];
  return {
    id: txId,
    account: chain,
    index,
    address,
    inputs,
    outputs,
    block: pending ? null : block,
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
    derivationMode: DerivationModes.NATIVE_SEGWIT,
  });
  const receiveIndexes = txs.filter(tx => tx.chain === RECEIVE).map(tx => tx.index);
  xpub.freshAddressIndex = receiveIndexes.length ? Math.max(...receiveIndexes) + 1 : 0;
  return {
    freshAddress: await derive(RECEIVE, xpub.freshAddressIndex),
    bitcoinResources: { utxos: [], walletAccount: { xpub } },
  } as unknown as Account;
};

const used = (chain: number, indexes: number[]): StoredTx[] =>
  indexes.map(index => ({ chain, index }));

describe("getAddressesToWatch", () => {
  it("returns the funded addresses and the last 20 addresses of each chain with the next unused ones", async () => {
    const account = await makeAccount([
      ...used(RECEIVE, range(0, 30)).map(tx =>
        tx.index === 3 ? { ...tx, outputValue: "1000" } : tx,
      ),
      ...used(CHANGE, range(0, 25)),
    ]);

    expect(await getAddressesToWatch(account)).toEqual([
      await derive(RECEIVE, 3),
      ...(await deriveAll(RECEIVE, range(10, 31))),
      ...(await deriveAll(CHANGE, range(5, 26))),
    ]);
  });

  it("returns every derived address while a chain has fewer than 20", async () => {
    const account = await makeAccount([...used(RECEIVE, [0, 1]), ...used(CHANGE, [0])]);

    expect(await getAddressesToWatch(account)).toEqual([
      ...(await deriveAll(RECEIVE, [0, 1, 2])),
      ...(await deriveAll(CHANGE, [0, 1])),
    ]);
  });

  it("returns the fresh receive and the first change address of an unused account", async () => {
    const account = await makeAccount([]);

    expect(await getAddressesToWatch(account)).toEqual([
      await derive(RECEIVE, 0),
      await derive(CHANGE, 0),
    ]);
  });

  it("counts pending incoming funds as funds", async () => {
    const account = await makeAccount([
      ...used(RECEIVE, range(0, 30)).map(tx =>
        tx.index === 2 ? { ...tx, outputValue: "1000", pending: true } : tx,
      ),
    ]);

    expect(await getAddressesToWatch(account)).toContain(await derive(RECEIVE, 2));
  });

  it("drops an old address once its funds are spent", async () => {
    const account = await makeAccount([
      ...used(RECEIVE, range(0, 30)).map(tx =>
        tx.index === 4 ? { ...tx, outputValue: "1000" } : tx,
      ),
      { chain: CHANGE, index: 0, id: "spend", spends: { chain: RECEIVE, index: 4, id: "tx-0-4" } },
    ]);

    expect(await getAddressesToWatch(account)).not.toContain(await derive(RECEIVE, 4));
  });

  it("falls back to the fresh address when the wallet account is not loaded", async () => {
    const account = { freshAddress: "bc1receive0", bitcoinResources: { utxos: [] } };

    expect(await getAddressesToWatch(account as unknown as Account)).toEqual(["bc1receive0"]);
  });

  it("returns nothing for an account without any address", async () => {
    const account = { freshAddress: "", bitcoinResources: { utxos: [] } };

    expect(await getAddressesToWatch(account as unknown as Account)).toEqual([]);
  });
});
