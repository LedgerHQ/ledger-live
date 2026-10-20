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
const deriveAll = (paths: [chain: number, index: number][]) =>
  Promise.all(paths.map(([chain, index]) => derive(chain, index)));
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

const funded = (txs: StoredTx[], indexes: number[]) =>
  txs.map(tx => (indexes.includes(tx.index) ? { ...tx, outputValue: "1000" } : tx));

describe("getAddressesToWatch", () => {
  it("returns the funded addresses with the next receive and change addresses", async () => {
    const account = await makeAccount([
      ...funded(used(RECEIVE, range(0, 10)), [3, 7]),
      ...funded(used(CHANGE, range(0, 5)), [2]),
    ]);

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

  it("returns the first receive and change addresses of an unused account", async () => {
    const account = await makeAccount([]);

    expect(await getAddressesToWatch(account)).toEqual(
      await deriveAll([
        [RECEIVE, 0],
        [CHANGE, 0],
      ]),
    );
  });

  it("counts pending incoming funds as funds", async () => {
    const account = await makeAccount([
      ...used(RECEIVE, range(0, 3)).map(tx =>
        tx.index === 1 ? { ...tx, outputValue: "1000", pending: true } : tx,
      ),
    ]);

    expect((await getAddressesToWatch(account)).sort()).toEqual(
      (
        await deriveAll([
          [RECEIVE, 1],
          [RECEIVE, 3],
          [CHANGE, 0],
        ])
      ).sort(),
    );
  });

  it("drops an address once its funds are spent", async () => {
    const account = await makeAccount([
      ...funded(used(RECEIVE, range(0, 3)), [1]),
      { chain: CHANGE, index: 0, id: "spend", spends: { chain: RECEIVE, index: 1, id: "tx-0-1" } },
    ]);

    expect((await getAddressesToWatch(account)).sort()).toEqual(
      (
        await deriveAll([
          [RECEIVE, 3],
          [CHANGE, 1],
        ])
      ).sort(),
    );
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
