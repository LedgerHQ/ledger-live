import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { BitcoinTxDetails } from "@ledgerhq/coin-bitcoin/api";
import { getNetworkParameters } from "@ledgerhq/coin-bitcoin/api";
import type { BitcoinAccount, BitcoinAccountState } from "../types";
import { cryptoFor } from "./derivation";
import { emptyAccountState } from "./state";
import { GAP, REWIND_BLOCKS, bitcoinFamily } from "./family";
import { bitcoinAccountLayer } from "./index";

// the bitcoin family through the multi-address engine, as the generic bridge runs it
const getAccountShape = (info: unknown, dependencies: unknown) =>
  bitcoinAccountLayer.getAccountShape(
    info as never,
    { paginationConfig: {} },
    dependencies as never,
  ) as Promise<Partial<BitcoinAccount>>;

const XPUB =
  "xpub6BkvrczwoUfLGaNPQFdWXaNFCLzojvw7jFqmKPffS3up21H9uWvo6PcBsQn151ZaffZnyMSZahKfHJSGu7bUViQYDGw3YaEHTM7AjqPhqXC";
const ACCOUNT_ID = `js:2:bitcoin:${XPUB}:native_segwit`;
const bitcoin = getCryptoCurrencyById("bitcoin");
const address = (chain: number, index: number, currency = "bitcoin") =>
  cryptoFor(currency).getAddress("Native SegWit", XPUB, chain, index);

type Pages = Record<string, Array<{ txs: BitcoinTxDetails[]; next?: string }>>;

function fakeApi(pages: Pages, tip = 200) {
  const listOperations = jest.fn(
    async (_ctx: unknown, addr: string, { cursor }: { minHeight: number; cursor?: string }) => {
      const list = pages[addr] ?? [];
      const page = list[cursor ? Number(cursor) : 0] ?? { txs: [] };
      return {
        items: page.txs.map(tx => ({ details: { version: 1, pending: tx.block === null, tx } })),
        next: page.next,
      };
    },
  );
  return {
    lastBlock: jest.fn(async () => ({ height: tip, hash: `h${tip}`, time: new Date() })),
    getBlockInfo: jest.fn(async (_ctx: unknown, height: number) => ({
      height,
      hash: `h${height}`,
    })),
    listOperations,
  };
}

const tx = (id: string, overrides: Partial<BitcoinTxDetails>): BitcoinTxDetails => ({
  id,
  receivedAt: "2026-01-01T00:00:00Z",
  block: { height: 10, hash: "h10", time: "2026-01-01T00:00:00Z" },
  fees: "100",
  inputs: [],
  outputs: [],
  ...overrides,
});

const info = (initialAccount?: Partial<BitcoinAccount>) =>
  ({
    currency: bitcoin,
    address: "",
    index: 0,
    derivationPath: "84'/0'",
    derivationMode: "native_segwit",
    deviceId: "device",
    initialAccount,
  }) as never;

const signer = { getWalletXpub: jest.fn(async () => XPUB) };
const signerContext = jest.fn(async (_deviceId: string, fn: (s: typeof signer) => unknown) =>
  fn(signer),
);
const deps = (api: ReturnType<typeof fakeApi>) => ({
  api: api as never,
  context: {} as never,
  signerContext: signerContext as never,
});

beforeEach(() => jest.clearAllMocks());

describe("bitcoinFamily", () => {
  it("walks a receive and a change chain with a gap of 20, re-reading 6 blocks", () => {
    expect(bitcoinFamily).toMatchObject({
      chains: [0, 1],
      receiveChain: 0,
      gapLimit: 20,
      rewindBlocks: 6,
    });
    expect(GAP).toBe(20);
    expect(bitcoinFamily.resyncError()).toMatchObject({ name: "AccountNeedResync" });
  });
});

describe("getAccountShape", () => {
  it("scans a new account: xpub from the device, gap walk on both chains", async () => {
    const receive0 = await address(0, 0);
    const funding = tx("fund", {
      inputs: [{ txid: "x", vout: 0, address: "ext", value: "100100", sequence: 0xffffffff }],
      outputs: [{ index: 0, address: receive0, value: "100000" }],
    });
    const api = fakeApi({ [receive0]: [{ txs: [funding] }] });

    const shape = await getAccountShape(info(), deps(api));

    expect(signer.getWalletXpub).toHaveBeenCalledWith({
      currencyId: "bitcoin",
      path: "84'/0'/0'",
      xpubVersion: getNetworkParameters("bitcoin").xpubVersion.readUInt32BE(0),
    });
    expect(shape).toMatchObject({
      id: ACCOUNT_ID,
      xpub: XPUB,
      balance: new BigNumber(100_000),
      spendableBalance: new BigNumber(100_000),
      operationsCount: 1,
      freshAddress: await address(0, 1),
      freshAddressPath: "84'/0'/0'/0/1",
      blockHeight: 200,
    });
    expect(shape.operations?.[0]).toMatchObject({ type: "IN", hash: "fund" });
    expect(shape.bitcoinResources?.utxos).toEqual([
      expect.objectContaining({ hash: "fund", outputIndex: 0, isChange: false, blockHeight: 10 }),
    ]);
    expect(shape.bitcoinResources?.accountState).toEqual({
      version: 1,
      syncedHeight: 200,
      anchor: { height: 10, hash: "h10" },
      addresses: [{ address: receive0, chain: 0, index: 0 }],
      confirmedUtxos: [
        { txid: "fund", vout: 0, value: "100000", address: receive0, blockHeight: 10, rbf: false },
      ],
    });
    // one used batch then one empty on receive, one empty on change
    expect(api.listOperations).toHaveBeenCalledTimes(60);
  });

  it("requires a device to read the xpub of a new account", async () => {
    await expect(
      getAccountShape({ ...(info() as object), deviceId: undefined } as never, deps(fakeApi({}))),
    ).rejects.toThrow("deviceId required to generate the xpub");
  });

  describe("an account synced before", () => {
    async function synced() {
      const receive0 = await address(0, 0);
      const funding = tx("fund", { outputs: [{ index: 0, address: receive0, value: "100000" }] });
      const first = await getAccountShape(
        info(),
        deps(fakeApi({ [receive0]: [{ txs: [funding] }] })),
      );
      // the first sync of a new account reads the xpub; the next ones must not
      signer.getWalletXpub.mockClear();
      return { receive0, account: { id: ACCOUNT_ID, ...first } as BitcoinAccount };
    }

    it("resumes a few blocks below the last tip and discovers new change", async () => {
      const { receive0, account } = await synced();
      const change0 = await address(1, 0);
      const spend = tx("spend", {
        block: { height: 205, hash: "h205", time: "2026-01-03T00:00:00Z" },
        inputs: [{ txid: "fund", vout: 0, address: receive0, value: "100000", sequence: 0 }],
        outputs: [
          { index: 0, address: "ext", value: "60000" },
          { index: 1, address: change0, value: "39000" },
        ],
      });
      const api = fakeApi({ [receive0]: [{ txs: [spend] }], [change0]: [{ txs: [spend] }] }, 210);

      const shape = await getAccountShape(info(account), deps(api));

      expect(signer.getWalletXpub).not.toHaveBeenCalled();
      const minHeights = new Map(
        api.listOperations.mock.calls.map(([, addr, options]) => [addr, options.minHeight]),
      );
      expect(minHeights.get(receive0)).toBe(200 - REWIND_BLOCKS);
      expect(minHeights.get(change0)).toBe(0);
      expect(shape.balance).toEqual(new BigNumber(39_000));
      expect(shape.operations?.map(op => [op.type, op.hash])).toEqual([
        ["OUT", "spend"],
        ["IN", "fund"],
      ]);
      expect(shape.bitcoinResources?.utxos).toEqual([
        expect.objectContaining({ hash: "spend", outputIndex: 1, isChange: true }),
      ]);
      expect(shape.bitcoinResources?.accountState?.anchor).toEqual({ height: 205, hash: "h205" });
      expect(shape.bitcoinResources?.accountState?.addresses).toEqual([
        { address: receive0, chain: 0, index: 0 },
        { address: change0, chain: 1, index: 0 },
      ]);
    });

    it("syncs again from scratch after a reorg below its anchor", async () => {
      const { account } = await synced();
      const api = fakeApi({});
      api.getBlockInfo.mockResolvedValue({ height: 10, hash: "another" });

      const shape = await getAccountShape(info(account), deps(api));

      expect(shape.operations).toEqual([]);
      expect(shape.balance).toEqual(new BigNumber(0));
      expect(api.listOperations.mock.calls.every(([, , options]) => options.minHeight === 0)).toBe(
        true,
      );
    });

    it("does not take a failing reorg check for a reorg", async () => {
      const { account } = await synced();
      const api = fakeApi({});
      api.getBlockInfo.mockRejectedValue(new Error("down"));

      const shape = await getAccountShape(info(account), deps(api));

      expect(shape.operations).toHaveLength(1);
      expect(shape.balance).toEqual(new BigNumber(100_000));
    });
  });

  it("counts the mempool, and prefers a confirmed copy of a transaction", async () => {
    const receive0 = await address(0, 0);
    const receive1 = await address(0, 1);
    const confirmed = tx("both", { outputs: [{ index: 0, address: receive0, value: "1000" }] });
    const pending = tx("pending", {
      block: null,
      receivedAt: new Date().toISOString(),
      outputs: [{ index: 0, address: receive1, value: "500" }],
    });
    const api = fakeApi({
      [receive0]: [{ txs: [{ ...confirmed, block: null }, confirmed] }],
      [receive1]: [{ txs: [pending] }],
    });

    const shape = await getAccountShape(info(), deps(api));

    expect(shape.balance).toEqual(new BigNumber(1_500));
    expect(shape.freshAddressPath).toBe("84'/0'/0'/0/2");
    expect(shape.bitcoinResources?.accountState?.confirmedUtxos).toHaveLength(1);
    expect(shape.operations?.find(op => op.hash === "pending")?.blockHeight).toBeUndefined();
  });

  it("follows the pages of an address, and stops on a cursor that does not advance", async () => {
    const receive0 = await address(0, 0);
    const api = fakeApi({
      [receive0]: [
        { txs: [tx("a", { outputs: [{ index: 0, address: receive0, value: "1" }] })], next: "1" },
        { txs: [tx("b", { outputs: [{ index: 0, address: receive0, value: "2" }] })], next: "1" },
      ],
    });

    const shape = await getAccountShape(info(), deps(api));

    expect(shape.balance).toEqual(new BigNumber(3));
    expect(api.listOperations.mock.calls.filter(([, addr]) => addr === receive0)).toHaveLength(2);
  });

  it("converts an account still carrying the legacy transaction store", async () => {
    const receive0 = await address(0, 0);
    const exportSync = jest.fn(() => ({
      txs: [
        {
          id: "old",
          account: 0,
          index: 0,
          address: receive0,
          received_at: "2026-01-01T00:00:00Z",
          block: { height: 150, hash: "h150", time: "2026-01-01T00:00:00Z" },
          inputs: [],
          outputs: [
            {
              value: "777",
              address: receive0,
              output_hash: "old",
              output_index: 0,
              block_height: 150,
              rbf: false,
            },
          ],
        },
      ],
      addressCache: {},
    }));
    const legacy = {
      id: ACCOUNT_ID,
      blockHeight: 190,
      operations: [],
      bitcoinResources: {
        utxos: [],
        walletAccount: {
          params: { path: "84'/0'", index: 0 },
          xpub: { xpub: XPUB, storage: { exportSync } },
        },
      },
    } as unknown as BitcoinAccount;
    const api = fakeApi({});

    const shape = await getAccountShape(info(legacy), deps(api));

    expect(exportSync).toHaveBeenCalled();
    expect(shape.balance).toEqual(new BigNumber(777));
    const receiveCall = api.listOperations.mock.calls.find(([, addr]) => addr === receive0);
    expect(receiveCall?.[2].minHeight).toBe(190 - REWIND_BLOCKS);
  });

  it("uses an empty state when there is none to read", async () => {
    const account = {
      id: ACCOUNT_ID,
      operations: [],
      bitcoinResources: { utxos: [], accountState: { ...emptyAccountState(), version: 9 } },
    } as unknown as BitcoinAccount;
    const shape = await getAccountShape(info(account), deps(fakeApi({})));
    expect(shape.bitcoinResources?.accountState?.syncedHeight).toBe(200);
    expect(shape.freshAddressPath).toBe("84'/0'/0'/0/0");
  });

  it("shows Bitcoin Cash addresses without their prefix", async () => {
    const bch = getCryptoCurrencyById("bitcoin_cash");
    const shape = await getAccountShape(
      {
        ...(info() as object),
        currency: bch,
        derivationPath: "44'/145'",
        derivationMode: "",
      } as never,
      deps(fakeApi({})),
    );
    expect(shape.freshAddress).not.toContain("bitcoincash:");
  });
});
