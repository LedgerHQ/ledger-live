import { BigNumber } from "bignumber.js";
import { firstValueFrom, lastValueFrom, of, toArray } from "rxjs";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { SYNC_TYPE_SHIELDED, SYNC_TYPE_TRANSPARENT } from "@ledgerhq/types-live";
import type { SyncConfig } from "@ledgerhq/types-live";
import type { Output as WalletOutput, TX } from "@ledgerhq/wallet-btc/index";
import {
  buildExtraSyncObservable,
  buildSyncObservables,
  fromWalletUtxo,
  makeGetAccountShape,
  performTransparentSync,
  zcashSyncShielded,
} from "./sync";
import { clearTransactionDetailsCache } from "./transaction-details";
import type { ZcashAccount } from "../types/bridge";
import type { SignerContext } from "../types/signer";

const generateAccount = jest.fn((..._args: unknown[]): unknown => undefined);
const syncAccount = jest.fn(async (..._args: unknown[]) => undefined);
const getAccountTransactions = jest.fn(async (..._args: unknown[]) => ({ txs: [] as TX[] }));
const getAccountUnspentUtxos = jest.fn(async (..._args: unknown[]) => [] as WalletOutput[]);

jest.mock("@ledgerhq/wallet-btc/index", () => ({
  ...jest.requireActual("@ledgerhq/wallet-btc/index"),
  __esModule: true,
  default: {
    generateAccount: (...args: unknown[]) => generateAccount(...args),
    syncAccount: (...args: unknown[]) => syncAccount(...args),
    getAccountTransactions: (...args: unknown[]) => getAccountTransactions(...args),
    getAccountUnspentUtxos: (...args: unknown[]) => getAccountUnspentUtxos(...args),
  },
}));

const getZCashClient = jest.fn();
jest.mock("../logic/engineClient", () => ({
  getZCashModule: jest.fn(),
  getZCashClient: (...args: unknown[]) => getZCashClient(...args),
}));

const currency = getCryptoCurrencyById("zcash");

const OWN = "t1OwnReceiveAddress";
const CHANGE = "t1OwnChangeAddress";
const THEIRS = "t1SomeoneElseAddress";
const XPUB = "xpub6DZ";

const walletAccount = () => ({
  xpub: {
    xpub: XPUB,
    freshAddress: OWN,
    freshAddressIndex: 4,
    explorer: { getCurrentBlock: jest.fn(async () => ({ height: 3_425_900 })) },
    getXpubAddresses: jest.fn(async () => [{ address: OWN }, { address: CHANGE }]),
    storage: { getUniquesAddresses: jest.fn(() => [{ address: CHANGE }]) },
  },
});

const output = (overrides: Partial<WalletOutput> = {}): WalletOutput =>
  ({
    address: OWN,
    output_hash: "aa".repeat(32),
    output_index: 0,
    value: "70000",
    block_height: 3_425_800,
    rbf: false,
    ...overrides,
  }) as unknown as WalletOutput;

const incomingTx = (): TX =>
  ({
    id: "tx-in",
    fees: "0",
    received_at: "2026-07-01T00:00:00.000Z",
    block: { height: 3_425_800, hash: "bb".repeat(32), time: "2026-07-01T00:00:00.000Z" },
    inputs: [{ address: THEIRS, value: "90000", output_hash: "cc".repeat(32), output_index: 1 }],
    outputs: [output()],
  }) as unknown as TX;

/** Spends the account's own coin, paying a third party and its own change. */
const outgoingTx = (): TX =>
  ({
    id: "tx-out",
    fees: "10000",
    received_at: "2026-07-02T00:00:00.000Z",
    block: { height: 3_425_850, hash: "dd".repeat(32), time: "2026-07-02T00:00:00.000Z" },
    inputs: [
      {
        address: OWN,
        value: "70000",
        sequence: 0xfffffffe,
        output_hash: "aa".repeat(32),
        output_index: 0,
      },
    ],
    outputs: [
      output({ address: THEIRS, output_hash: "ee".repeat(32), output_index: 0, value: "40000" }),
      output({ address: CHANGE, output_hash: "ee".repeat(32), output_index: 1, value: "20000" }),
    ],
  }) as unknown as TX;

const privateInfo = (overrides: Record<string, unknown> = {}) =>
  ({
    orchardBalance: new BigNumber(0),
    saplingBalance: new BigNumber(0),
    ironwoodBalance: new BigNumber(0),
    syncState: "ready" as const,
    progress: 0,
    estimatedTimeRemaining: { hours: 0, minutes: 0 },
    ufvk: "uview1key",
    birthday: null,
    lastSyncTimestamp: null,
    lastProcessedBlock: null,
    transactions: [],
    ...overrides,
  }) as ZcashAccount["privateInfo"];

const info = (overrides: Record<string, unknown> = {}) =>
  ({
    currency,
    index: 0,
    derivationPath: "44'/133'/0'/0/0",
    derivationMode: "",
    deviceId: "deviceId",
    initialAccount: {
      id: "js:2:zcash:xpub6DZ:",
      operations: [],
      bitcoinResources: { utxos: [], walletAccount: walletAccount() },
    },
    ...overrides,
  }) as never;

const deviceGetAddress = jest.fn(async (path: string, _verify?: boolean) => ({
  publicKey: "02".padEnd(66, "a"),
  chainCode: "cc".repeat(32),
  address: path,
}));

const signerContext = (async (_deviceId: string, fn: (signer: unknown) => unknown) =>
  fn({ getAddress: deviceGetAddress })) as unknown as SignerContext;

/**
 * The depth and child number a composed xpub carries, read back out of the
 * base58check serialization -- bytes 4 and 9..13 of the BIP-32 header.
 */
const serializedXpub = (xpub: string): { depth: number; childNumber: number } => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bs58 = require("bs58");
  const raw = Buffer.from(bs58.decode(xpub) as Uint8Array);
  return { depth: raw[4], childNumber: raw.readUInt32BE(9) };
};

beforeEach(() => {
  jest.clearAllMocks();
  // Resolved details are cached across syncs, deliberately -- a mined
  // transaction only has to be resolved once.
  clearTransactionDetailsCache();
  generateAccount.mockImplementation(async () => walletAccount());
  getAccountTransactions.mockImplementation(async () => ({ txs: [] }));
  getAccountUnspentUtxos.mockImplementation(async () => []);
  // No transaction-detail capability: the explorer's view stands as-is.
  getZCashClient.mockImplementation(async () => ({}));
});

describe("fromWalletUtxo", () => {
  it("recognises the account's own change among its coins", () => {
    expect(fromWalletUtxo(output({ address: CHANGE }), new Set([CHANGE]))).toEqual({
      hash: "aa".repeat(32),
      outputIndex: 0,
      blockHeight: 3_425_800,
      address: CHANGE,
      value: new BigNumber(70_000),
      rbf: false,
      isChange: true,
    });
    expect(fromWalletUtxo(output(), new Set([CHANGE])).isChange).toBe(false);
  });
});

describe("performTransparentSync", () => {
  it("reports the account shape the explorer describes", async () => {
    getAccountTransactions.mockResolvedValue({ txs: [incomingTx()] });
    getAccountUnspentUtxos.mockResolvedValue([output()]);

    const shape = await performTransparentSync(info(), signerContext);

    expect(shape).toMatchObject({
      id: "js:2:zcash:xpub6DZ:",
      xpub: XPUB,
      balance: new BigNumber(70_000),
      spendableBalance: new BigNumber(70_000),
      blockHeight: 3_425_900,
      freshAddress: OWN,
      freshAddressPath: "44'/133'/0'/0/4",
      operationsCount: 1,
    });
    expect(shape.bitcoinResources?.utxos).toEqual([
      {
        hash: "aa".repeat(32),
        outputIndex: 0,
        blockHeight: 3_425_800,
        address: OWN,
        value: new BigNumber(70_000),
        rbf: false,
        isChange: false,
      },
    ]);
    // Scanned up to the tip the explorer reported, on the account the shape carries.
    expect(syncAccount).toHaveBeenCalledWith(shape.bitcoinResources?.walletAccount, 3_425_900);
  });

  it("derives an incoming operation crediting the account", async () => {
    getAccountTransactions.mockResolvedValue({ txs: [incomingTx()] });

    const [operation] = (await performTransparentSync(info(), signerContext)).operations ?? [];

    expect(operation).toMatchObject({
      hash: "tx-in",
      type: "IN",
      value: new BigNumber(70_000),
      senders: [THEIRS],
      recipients: [OWN],
      blockHeight: 3_425_800,
    });
    expect(operation.extra).toEqual({ inputs: [`${"cc".repeat(32)}-1`] });
  });

  // A send debits what it spends minus what comes back as change, lists the
  // third party rather than the change address, and credits nothing: change
  // returning to us is not income.
  it("derives an outgoing operation that excludes its own change", async () => {
    getAccountTransactions.mockResolvedValue({ txs: [outgoingTx()] });

    const operations = (await performTransparentSync(info(), signerContext)).operations ?? [];

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      type: "OUT",
      value: new BigNumber(50_000),
      fee: new BigNumber(10_000),
      recipients: [THEIRS],
      senders: [OWN],
    });
  });

  // Only the spendable Ironwood pool is added to the transparent balance; the
  // deprecated Orchard notes are excluded from the total (see balance.ts).
  it("counts the spendable Ironwood pool in the balance it reports", async () => {
    getAccountUnspentUtxos.mockResolvedValue([output()]);
    const shielded = info({
      initialAccount: {
        id: "js:2:zcash:xpub6DZ:",
        operations: [],
        bitcoinResources: { utxos: [], walletAccount: walletAccount() },
        privateInfo: privateInfo({
          orchardBalance: new BigNumber(30_000),
          ironwoodBalance: new BigNumber(5_000),
        }),
      },
    });

    expect((await performTransparentSync(shielded, signerContext)).balance).toEqual(
      new BigNumber(75_000),
    );
  });

  it("reuses the wallet account the previous sync left behind", async () => {
    const previous = walletAccount();
    const existing = info({
      initialAccount: {
        id: "js:2:zcash:xpub6DZ:",
        operations: [],
        bitcoinResources: { utxos: [], walletAccount: previous },
      },
    });

    const shape = await performTransparentSync(existing, signerContext);

    // Re-deriving it would mean rescanning the gap limit on every sync.
    expect(shape.bitcoinResources?.walletAccount).toBe(previous);
    expect(generateAccount).not.toHaveBeenCalled();
  });

  it("composes the xpub on the device for an account that has none yet", async () => {
    const fresh = info({ initialAccount: undefined });

    const shape = await performTransparentSync(fresh, signerContext);

    // Both keys of the BIP-32 serialization come from one device session, and
    // the account path is `44'/133'/0'`: depth 3, hardened child. Losing the
    // hardened bit would derive a different -- valid-looking -- xpub.
    expect(deviceGetAddress.mock.calls.map(([path]) => path)).toEqual(["44'/133'", "44'/133'/0'"]);
    expect(serializedXpub(shape.xpub as string)).toEqual({ depth: 3, childNumber: 0x8000_0000 });
    expect(shape.id).toContain(shape.xpub as string);
  });

  it("cannot compose an xpub without a device", async () => {
    await expect(
      performTransparentSync(
        info({ initialAccount: undefined, deviceId: undefined }),
        signerContext,
      ),
    ).rejects.toThrow("deviceId required to generate the xpub");
  });

  // The recovery reaches the network. A sync that already holds the explorer's
  // answer must not be lost because that reach failed.
  it("keeps the explorer's view when the engine cannot be reached", async () => {
    getAccountTransactions.mockResolvedValue({ txs: [incomingTx()] });
    getZCashClient.mockRejectedValue(new Error("zaino unreachable"));

    const shape = await performTransparentSync(info(), signerContext);

    expect(shape.operations).toMatchObject([{ hash: "tx-in", recipients: [OWN] }]);
  });

  // The payee lives in an encrypted output, so only the viewing key can recover
  // it; the transparent change the explorer reported is not the destination.
  it("replaces the recipient of a send whose real payee only the chain knows", async () => {
    getAccountTransactions.mockResolvedValue({ txs: [outgoingTx()] });
    getZCashClient.mockResolvedValue({
      transactionDetails: jest.fn(async () => [
        { txid: "tx-out", fee: "10000", payees: ["u1realrecipient"] },
      ]),
    });
    const withKey = info({
      initialAccount: {
        id: "js:2:zcash:xpub6DZ:",
        operations: [],
        bitcoinResources: { utxos: [], walletAccount: walletAccount() },
        privateInfo: privateInfo(),
      },
    });

    const operations = (await performTransparentSync(withKey, signerContext)).operations ?? [];

    expect(operations.find(op => op.type === "OUT")?.recipients).toEqual([
      THEIRS,
      "u1realrecipient",
    ]);
  });

  it("cannot recover a payee before the account's viewing key is known", async () => {
    getAccountTransactions.mockResolvedValue({ txs: [outgoingTx()] });
    const transactionDetails = jest.fn(async () => [
      { txid: "tx-out", fee: "10000", payees: ["u1realrecipient"] },
    ]);
    getZCashClient.mockResolvedValue({ transactionDetails });

    const operations = (await performTransparentSync(info(), signerContext)).operations ?? [];

    expect(transactionDetails).toHaveBeenCalledWith(expect.anything(), undefined);
    expect(operations[0].recipients).toEqual([THEIRS]);
  });

  // A coin still in the mempool is spendable, so it counts towards the balance
  // and keeps its replaceability; its height stays null, as the explorer
  // reported it and as the serialization expects.
  it("keeps an unconfirmed coin that no replacement dropped", async () => {
    getAccountUnspentUtxos.mockResolvedValue([
      output({ block_height: null, rbf: true, output_hash: "ff".repeat(32) }),
    ]);

    const shape = await performTransparentSync(info(), signerContext);

    expect(shape.bitcoinResources?.utxos).toEqual([
      {
        hash: "ff".repeat(32),
        outputIndex: 0,
        blockHeight: null,
        address: OWN,
        value: new BigNumber(70_000),
        rbf: true,
        isChange: false,
      },
    ]);
    expect(shape.balance).toEqual(new BigNumber(70_000));
  });
});

describe("zcashSyncShielded", () => {
  const syncConfig = { syncType: SYNC_TYPE_SHIELDED } as SyncConfig;
  const chunk = { transactions: [], processedBlocks: 10, remainingBlocks: 0 };

  const clientSpy = () => {
    const syncShielded = jest.fn(() => of(chunk));
    const findBlockHeight = jest.fn(async () => 1_687_104);
    getZCashClient.mockResolvedValue({ syncShielded, findBlockHeight });
    return { syncShielded, findBlockHeight };
  };

  it("refuses to scan without a viewing key", async () => {
    await expect(
      firstValueFrom(zcashSyncShielded(info({ initialAccount: {} }), syncConfig)),
    ).rejects.toThrow("Missing unified full viewing key (ufvk) for ZCash shielded sync");
  });

  it("resumes at the block after the last one processed", async () => {
    const { syncShielded, findBlockHeight } = clientSpy();
    const account = { privateInfo: privateInfo({ lastProcessedBlock: 3_425_000 }) };

    await firstValueFrom(zcashSyncShielded(info({ initialAccount: account }), syncConfig));

    expect(syncShielded).toHaveBeenCalledWith(
      expect.objectContaining({ startBlockHeight: 3_425_001, viewingKey: "uview1key" }),
    );
    expect(findBlockHeight).not.toHaveBeenCalled();
  });

  it("starts a first scan at the account's birthday", async () => {
    const { syncShielded, findBlockHeight } = clientSpy();
    const account = { privateInfo: privateInfo({ birthday: "2022-05-31" }) };

    await firstValueFrom(zcashSyncShielded(info({ initialAccount: account }), syncConfig));

    expect(findBlockHeight).toHaveBeenCalledWith(Math.floor(Date.parse("2022-05-31") / 1000));
    expect(syncShielded).toHaveBeenCalledWith(
      expect.objectContaining({ startBlockHeight: 1_687_104 }),
    );
  });

  it("scans from the genesis block when it knows nothing about the account", async () => {
    const { syncShielded } = clientSpy();

    await firstValueFrom(
      zcashSyncShielded(info({ initialAccount: { privateInfo: privateInfo() } }), syncConfig),
    );

    expect(syncShielded).toHaveBeenCalledWith(expect.objectContaining({ startBlockHeight: 0 }));
  });

  // The scanner needs the nullifiers to tell which of our notes a block spends,
  // and the NAPI takes one list for every pool.
  it("declares the unspent nullifiers of both shielded pools", async () => {
    const { syncShielded } = clientSpy();
    const note = (nullifier: string, isSpent = false) => ({
      amount: new BigNumber(1),
      memo: "",
      transfer_type: "incoming",
      nullifier,
      isSpent,
    });
    const account = {
      privateInfo: privateInfo({
        transactions: [
          {
            id: "tx",
            hex: "00",
            blockHeight: 1,
            blockHash: "h",
            timestamp: 1,
            fee: new BigNumber(0),
            decryptedData: {
              orchard_outputs: [note("aa"), note("bb", true), note("aa")],
              sapling_outputs: [],
              ironwood_outputs: [note("cc")],
            },
          },
        ],
      }),
    };

    await firstValueFrom(zcashSyncShielded(info({ initialAccount: account }), syncConfig));

    expect(syncShielded).toHaveBeenCalledWith(
      expect.objectContaining({ knownNullifiers: ["aa", "cc"] }),
    );
  });
});

describe("buildExtraSyncObservable", () => {
  it("stays out of a sync that did not ask for the shielded leg", () => {
    expect(
      buildExtraSyncObservable(info(), { syncType: SYNC_TYPE_TRANSPARENT } as SyncConfig),
    ).toBe(undefined);
  });

  it.each([
    ["the account has no viewing key", privateInfo({ ufvk: null })],
    ["its viewing key is an empty string", privateInfo({ ufvk: "" })],
    ["shielded sync is disabled on it", privateInfo({ syncState: "disabled" })],
    ["it has never been scanned", privateInfo({ syncState: "unknown" })],
    ["there is no account to scan yet", undefined],
  ])("stays out when %s", (_label, info_) => {
    expect(
      buildExtraSyncObservable(info({ initialAccount: info_ && { privateInfo: info_ } }), {
        syncType: SYNC_TYPE_SHIELDED,
      } as SyncConfig),
    ).toBe(undefined);
  });

  it.each(["ready", "running", "stopped", "outdated"])(
    "scans an account whose shielded state is %s",
    async syncState => {
      getZCashClient.mockResolvedValue({
        syncShielded: () =>
          of({
            transactions: [],
            processedBlocks: 5,
            remainingBlocks: 0,
            lastProcessedBlock: 5,
          }),
        findBlockHeight: jest.fn(),
      });
      const observable = buildExtraSyncObservable(
        info({
          initialAccount: {
            id: "js:2:zcash:xpub6DZ:",
            operations: [],
            privateInfo: privateInfo({ syncState, lastProcessedBlock: 1 }),
          },
        }),
        { syncType: SYNC_TYPE_SHIELDED } as SyncConfig,
      );

      // The scan reported no block left, so it reaches the account as complete,
      // with the cursor advanced to the block it stopped on.
      expect((await firstValueFrom(observable!)).privateInfo).toMatchObject({
        syncState: "complete",
        progress: 100,
        lastProcessedBlock: 5,
      });
    },
  );
});

describe("buildSyncObservables", () => {
  it("runs the transparent leg by default", async () => {
    getAccountUnspentUtxos.mockResolvedValue([output()]);

    const { syncs, syncType } = buildSyncObservables(info(), {} as SyncConfig, signerContext);

    expect(syncType).toBe(SYNC_TYPE_TRANSPARENT);
    expect(syncs).toHaveLength(1);
    expect(await firstValueFrom(syncs[0])).toMatchObject({ balance: new BigNumber(70_000) });
  });

  it("adds the shielded leg when it is asked for and the account is eligible", async () => {
    getAccountUnspentUtxos.mockResolvedValue([output()]);
    getZCashClient.mockResolvedValue({
      syncShielded: () =>
        of({ transactions: [], processedBlocks: 3, remainingBlocks: 0, lastProcessedBlock: 3 }),
      findBlockHeight: jest.fn(),
    });
    const eligible = info({
      initialAccount: {
        id: "js:2:zcash:xpub6DZ:",
        operations: [],
        bitcoinResources: { utxos: [], walletAccount: walletAccount() },
        privateInfo: privateInfo({ lastProcessedBlock: 1 }),
      },
    });

    const { syncs, syncType } = buildSyncObservables(
      eligible,
      { syncType: SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED } as SyncConfig,
      signerContext,
    );

    // Two legs, in that order: the transparent one reports a balance, the
    // shielded one reports where its scan got to.
    expect(syncType).toBe(SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED);
    const [transparent, shielded] = await Promise.all(syncs.map(sync => firstValueFrom(sync)));
    expect(transparent).toMatchObject({ balance: new BigNumber(70_000) });
    expect(shielded.privateInfo).toMatchObject({ syncState: "complete", lastProcessedBlock: 3 });
  });
});

describe("makeGetAccountShape", () => {
  it("emits the shape the transparent sync resolved", async () => {
    getAccountUnspentUtxos.mockResolvedValue([output()]);

    const shapes = await lastValueFrom(
      makeGetAccountShape(signerContext)(info(), {} as SyncConfig).pipe(toArray()),
    );

    expect(shapes).toHaveLength(1);
    expect(shapes[0]).toMatchObject({ balance: new BigNumber(70_000) });
  });

  it("completes without emitting when no leg was selected", async () => {
    const shapes = await lastValueFrom(
      makeGetAccountShape(signerContext)(info(), { syncType: 0 } as SyncConfig).pipe(toArray()),
    );

    expect(shapes).toEqual([]);
  });

  it("surfaces a failing leg to the caller", async () => {
    getAccountTransactions.mockRejectedValue(new Error("explorer down"));

    await expect(
      firstValueFrom(makeGetAccountShape(signerContext)(info(), {} as SyncConfig)),
    ).rejects.toThrow("explorer down");
  });
});
