import {
  clearAccount,
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import {
  fromAccountRaw,
  toAccountRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization/index";
import type { Account, AccountRaw, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CantonContext } from "../config";
import * as instrumentBalances from "../logic/instrumentBalances";
import * as gateway from "../network/gateway";
import { OperationInfo } from "../network/gateway";
import resolver from "../signer";
import { lastValueFrom } from "rxjs";
import { createMockCantonAccount, createMockCantonCurrency } from "../test/fixtures";
import { createBridges } from "./index";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { CantonAccount, CantonSigner } from "../types";
import * as onboard from "./onboard";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import { makeGetAccountShape, filterDisabledTokenAccounts, SYNC_HASH } from "./sync";

jest.mock("../network/gateway", () => ({
  ...jest.requireActual("../network/gateway"),
  getLedgerEnd: jest.fn(),
  getNativeInstrument: jest.fn(),
  getOperations: jest.fn(),
  getPartyById: jest.fn(),
  getPendingTransferProposals: jest.fn(),
  getCalTokensCached: jest.fn(),
  getEnabledInstrumentsCached: jest.fn(),
}));
jest.mock("../signer");
jest.mock("./onboard");
jest.mock("../logic/instrumentBalances");
const mockFindTokenByAddressInCurrency = jest.fn().mockResolvedValue(undefined);
const mockFindTokenById = jest.fn().mockResolvedValue(undefined);

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: jest.fn(() => ({
    findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
    findTokenById: mockFindTokenById,
  })),
}));

const mockedGetBalance = instrumentBalances.getInstrumentBalances as jest.Mock;
const mockedGetLedgerEnd = gateway.getLedgerEnd as jest.Mock;
const mockedGetNativeInstrument = gateway.getNativeInstrument as jest.Mock;
const mockedGetOperations = gateway.getOperations as jest.Mock;
const mockedGetPendingTransferProposals = gateway.getPendingTransferProposals as jest.Mock;
const mockedGetPartyById = gateway.getPartyById as jest.Mock;
const mockedGetCalTokensCached = gateway.getCalTokensCached as unknown as jest.Mock;
const mockedGetEnabledInstrumentsCached =
  gateway.getEnabledInstrumentsCached as unknown as jest.Mock;
const mockedResolver = resolver as jest.Mock;
const mockedIsOnboarded = onboard.isAccountOnboarded as jest.Mock;
const mockedIsAuthorized = onboard.isCantonCoinPreapproved as jest.Mock;

const sampleCurrency = createMockCantonCurrency();
const sampleConfig = { nativeInstrumentId: "Amulet", minReserve: "0", useGateway: true };
const fakeContext = {
  config: async () => sampleConfig,
  logger: () => {},
} as unknown as CantonContext;

type CantonBalance = {
  value: bigint;
  locked: bigint;
  asset: { type: "Amulet" } | { type: "token"; assetReference: string };
  utxoCount: number;
  isLocked: boolean;
  instrumentId: string;
  adminId: string;
};

const createMockNativeBalance = (amount: string, locked = false): CantonBalance => ({
  value: BigInt(amount),
  locked: locked ? BigInt(amount) : BigInt(0),
  asset: { type: "Amulet" },
  utxoCount: 1,
  isLocked: locked,
  instrumentId: "Amulet",
  adminId: "native-admin",
});

const impostorAmulet = (value: string): CantonBalance => ({
  ...createMockNativeBalance(value),
  asset: { type: "token", assetReference: "Amulet" },
  adminId: "impostor::1220dddd",
});

const createMockOperationView = (
  overrides: {
    instrumentId?: string;
    instrumentAdmin?: string | null;
    txHash?: string;
    uid?: string;
    type?: string;
    value?: string;
    operationType?: string;
  } = {},
): OperationInfo =>
  ({
    transaction_hash: overrides.txHash ?? "tx-test",
    uid: overrides.uid ?? "uid-test",
    type: overrides.type ?? "Send",
    status: "Success",
    fee: {
      value: "5",
      asset: {
        type: "native" as const,
        instrumentAdmin: "AmuletAdmin",
        instrumentId: "Amulet",
      },
      details: {
        type: "fee",
      },
    },
    transfers: [
      {
        address: "party123",
        type: "Send",
        value: overrides.value ?? "100",
        asset: overrides.instrumentId ?? "Amulet",
        details: {
          operationType: overrides.operationType ?? "transfer",
          metadata: {
            reason: "test transfer",
          },
        },
      },
    ],
    transaction_timestamp: new Date().toISOString(),
    senders: ["party123"],
    recipients: ["party456"],
    block: {
      height: 1,
      time: new Date().toISOString(),
      hash: "blockhash1",
    },
    asset: {
      type: "native",
      instrumentId: overrides.instrumentId ?? "Amulet",
      instrumentAdmin: overrides.instrumentAdmin ?? "AmuletAdmin",
    },
    details: {
      operationType: overrides.operationType ?? "transfer",
    },
  }) as OperationInfo;

const createMockCantonAccountShapeInfo = (
  overrides: Partial<AccountShapeInfo<CantonAccount>> = {},
): AccountShapeInfo<CantonAccount> => {
  const currency = createMockCantonCurrency();
  return {
    address: "addr1",
    currency,
    derivationMode: "",
    derivationPath: "44'/0'/0'/0/0",
    deviceId: "fakeDevice",
    index: 0,
    initialAccount: undefined,
    ...overrides,
  };
};

const tokenOperationView = (
  instrument: { instrumentId: string; instrumentAdmin: string },
  txHash: string,
  overrides: Partial<OperationInfo> = {},
): OperationInfo => ({
  ...createMockOperationView({ txHash, ...instrument }),
  asset: { type: "token", ...instrument },
  ...overrides,
});

/** A send row of a token transaction, with its transfer's memo. */
const tokenRowWithMemo = (
  instrument: { instrumentId: string; instrumentAdmin: string },
  uid: string,
  reason: string | undefined,
): OperationInfo =>
  tokenOperationView(instrument, "memo-tx", {
    uid,
    transfers: [
      {
        address: "party123",
        type: "Send",
        value: "100",
        asset: instrument.instrumentId,
        details: { operationType: "transfer", metadata: { reason } },
      },
    ],
  } as Partial<OperationInfo>);

const rowAtHeight = (txHash: string, height: number): OperationInfo => ({
  ...createMockOperationView({ txHash }),
  block: { height, time: "" },
});

/** A row at a height, timestamped in height order. */
const at = (row: OperationInfo, height: number): OperationInfo => ({
  ...row,
  transaction_timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, height)).toISOString(),
  block: { height, time: "" },
});

/** The fee charged for a transaction, over all its operations. */
const feeOf = (shape: Partial<CantonAccount>, hash: string) =>
  (shape.operations ?? [])
    .filter(op => op.hash === hash)
    .reduce((total, op) => total.plus(op.fee), BigNumber(0));

const fees = (shape: Partial<CantonAccount>) =>
  (shape.operations ?? []).filter(op => op.type === "FEES");

const storedOperation = (height: number, value = 1) =>
  ({
    id: `stored-${height}`,
    hash: `stored-${height}`,
    type: "OUT",
    value: BigNumber(value),
    fee: BigNumber(0),
    blockHeight: height,
    date: new Date(height),
    senders: [],
    recipients: [],
    extra: { instrumentId: "Amulet" },
  }) as unknown as CantonAccount["operations"][number];

/** A receive row of the "mixed-in" transaction, from a sender, with its transfer's memo. */
const receive = (uid: string, sender: string, reason: string): OperationInfo => {
  const row = createMockOperationView({ type: "Receive", txHash: "mixed-in", uid });
  return {
    ...row,
    senders: [sender],
    transfers: (row.transfers ?? []).map(transfer => ({
      ...transfer,
      details: { ...transfer.details, metadata: { reason } },
    })),
  };
};

/** A failed transfer instruction as the gateway sends it: one transfer of 0, with no fee. */
const failed = (row: OperationInfo): OperationInfo =>
  ({
    ...row,
    status: "Failed",
    fee: { ...row.fee, value: "0" },
    transfers: (row.transfers ?? []).map(transfer => ({
      ...transfer,
      value: "0",
      details: { ...transfer.details, operationType: "transfer-failed" },
    })),
  }) as OperationInfo;

const pendingOperation = (hash: string, sequence: number) =>
  ({
    ...storedOperation(sequence),
    id: `pending-${hash}`,
    hash,
    senders: ["party123"],
    date: new Date(),
    transactionSequenceNumber: BigNumber(sequence),
  }) as CantonAccount["operations"][number];

const readFrom = () => mockedGetOperations.mock.calls.map(([, , options]) => options);

const syncFrom = (initialAccount: Partial<CantonAccount>, context: CantonContext = fakeContext) =>
  makeGetAccountShape({} as SignerContext<CantonSigner>, context)(
    createMockCantonAccountShapeInfo({
      initialAccount: {
        xpub: "party123",
        operations: [],
        subAccounts: [],
        cantonResources: { isOnboarded: true, publicKey: "key" },
        ...initialAccount,
      } as unknown as CantonAccount,
    }),
    { paginationConfig: {} },
  );

/** A pending offer the account sent. */
const sentOffer = (hash: string) => ({
  contract_id: `contract-${hash}`,
  sender: "party123",
  receiver: "bob",
  amount: "100",
  instrument_id: "Amulet",
  instrument_admin: "native-admin",
  memo: "",
  expires_at_micros: 4_102_444_800_000_000,
  update_id: hash,
});

/** A sent offer's transaction: the proposal and its change, each with a fee of 5. */
const offerRows = (hash: string, height: number) => [
  at(createMockOperationView({ txHash: hash, operationType: "transfer-proposal" }), height),
  at(createMockOperationView({ txHash: hash, uid: `change-${hash}` }), height),
];

/** Syncs from the previous shape, its resources through a serialization round trip. */
const syncAfter = async (previous: Partial<CantonAccount>, syncHash: string | undefined) => {
  const raw = {} as AccountRaw;
  assignToAccountRaw(previous as Account, raw);
  const restored = {} as Account;
  assignFromAccountRaw(raw, restored);
  mockedGetOperations.mockClear();
  const shape = await syncFrom({
    syncHash,
    operations: previous.operations ?? [],
    subAccounts: previous.subAccounts ?? [],
    cantonResources: (restored as CantonAccount).cantonResources,
  });
  return { shape, from: readFrom().map(({ minOffset }) => minOffset) };
};

const resync = (previous: Partial<CantonAccount>) => syncAfter(previous, SYNC_HASH);

const feesOf = (shape: Partial<CantonAccount>, hash: string) =>
  (shape.operations ?? []).filter(op => op.hash === hash && op.type === "FEES");

const replayOf = (shape: Partial<CantonAccount>) => shape.cantonResources?.replayTransactions ?? [];

const checkpointOf = (shape: Partial<CantonAccount>) => shape.cantonResources?.scanCheckpoint;

const hashesOf = (shape: Partial<CantonAccount>) => shape.operations?.map(({ hash }) => hash);

const withoutFee = (row: OperationInfo): OperationInfo => ({
  ...row,
  fee: { ...row.fee, value: "0" },
});

/** A first sync, from an account without resources. */
const syncFirst = () => syncFrom({ syncHash: SYNC_HASH, cantonResources: {} as never });

/** The resources of a synced account, up to the given checkpoint. */
const resourcesUpTo = (scanCheckpoint: { hash: string; height: number }) => ({
  isOnboarded: true,
  publicKey: "key",
  instrumentUtxoCounts: {},
  pendingTransferProposals: [],
  scanCheckpoint,
});

/** A gateway that serves the rows from the requested offset, in one page. */
const serveRows = (rows: () => OperationInfo[]) =>
  mockedGetOperations.mockImplementation(async (_config, _party, { minOffset }) => ({
    operations: rows().filter(row => row.block.height >= minOffset),
    next: -1,
  }));

/** A first sync of the sent offer "offer" while pending: its fees only, and the offer to read again. */
const syncPending = async () => {
  const pending = await syncFrom({ syncHash: SYNC_HASH, cantonResources: {} as never });
  expect(feesOf(pending, "offer")).toEqual([
    expect.objectContaining({ value: BigNumber(10), fee: BigNumber(10) }),
  ]);
  expect(replayOf(pending)).toEqual([{ hash: "offer", height: 5 }]);
  return pending;
};

/** A full sync through the account bridge, from an account holding one stale operation. */
const syncAccount = async (
  syncHash: string | undefined,
  overrides: Partial<CantonAccount> = {},
) => {
  const initial = {
    ...createMockCantonAccount(),
    xpub: "party123",
    blockHeight: 20,
    syncHash,
    operations: [storedOperation(5, 999)],
    operationsCount: 1,
    cantonResources: { isOnboarded: true, publicKey: "key", pendingTransferProposals: [] },
    ...overrides,
  } as unknown as CantonAccount;
  const { accountBridge } = createBridges({} as SignerContext<CantonSigner>, fakeContext);
  const updater = await lastValueFrom(accountBridge.sync(initial, { paginationConfig: {} }));
  return updater(initial);
};

describe("makeGetAccountShape", () => {
  const fakeSignerContext = {} as any;

  const defaultInfo: AccountShapeInfo<CantonAccount> = {
    address: "addr1",
    currency: sampleCurrency,
    derivationMode: "",
    derivationPath: "44'/0'/0'/0/0",
    deviceId: "fakeDevice",
    index: 0,
    initialAccount: undefined,
  };
  const sync = () =>
    makeGetAccountShape(fakeSignerContext, fakeContext)(defaultInfo, { paginationConfig: {} });
  const syncRows = (rows: OperationInfo[]) => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
    mockedGetOperations.mockResolvedValue({ operations: rows });
    return sync();
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedResolver.mockReturnValue(async () => ({
      publicKey: "FAKE_PUBLIC_KEY",
    }));

    mockedIsOnboarded.mockResolvedValue({
      isOnboarded: true,
      partyId: "party123",
    });

    mockedIsAuthorized.mockResolvedValue(true);
    mockedGetLedgerEnd.mockResolvedValue(12345);
    mockedGetNativeInstrument.mockResolvedValue({
      instrumentId: "Amulet",
      instrumentAdmin: "native-admin",
    });
    mockedGetPendingTransferProposals.mockResolvedValue([]);
    mockedGetPartyById.mockResolvedValue({ party_id: "test-party-id", public_key: "" });
    mockedGetCalTokensCached.mockResolvedValue(new Map());
    mockFindTokenByAddressInCurrency.mockResolvedValue(undefined);
    mockFindTokenById.mockResolvedValue(undefined);
  });

  it("should return a valid account shape with correct balances and operations", async () => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          txHash: "tx1",
          uid: "uid1",
          type: "Send",
          value: "100",
        }),
      ],
    });
    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });

    expect(shape).toHaveProperty("id");
    expect(shape.balance).toEqual(BigNumber(1000));
    expect(shape.operations?.length).toBe(1);
    expect((shape.operations as any)[0].type).toBe("OUT");
    expect((shape.operations as any)[0].value).toEqual(BigNumber(105)); // 100 + 5 fee
    expect(shape.spendableBalance).toEqual(BigNumber(1000));
    expect(shape.used).toBe(true);
  });

  it("should handle locked balances correctly", async () => {
    mockedGetBalance.mockResolvedValue([
      createMockNativeBalance("1000", true),
      createMockNativeBalance("10", false),
    ]);

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });

    expect(shape).toMatchObject({
      balance: BigNumber(1010),
      spendableBalance: BigNumber(10),
    });
  });

  it("should not count the UTXOs of a locked zero-amount row", async () => {
    mockedGetBalance.mockResolvedValue([
      createMockNativeBalance("10"),
      { ...createMockNativeBalance("0", true), utxoCount: 5 },
    ]);

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(defaultInfo, { paginationConfig: {} });

    expect(shape.cantonResources?.instrumentUtxoCounts).toEqual({ Amulet: 1 });
  });

  it("should handle empty balances correctly", async () => {
    mockedGetBalance.mockResolvedValue([]);

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });

    expect(shape).toMatchObject({
      balance: BigNumber(0),
      spendableBalance: BigNumber(0),
    });
  });

  it("should default to FEES operation type when transferValue is 0", async () => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          txHash: "tx2",
          uid: "uid2",
          type: "Send",
          value: "0",
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });
    expect(shape).toMatchObject({
      operations: [
        expect.objectContaining({
          type: "FEES",
          // In this case, value should equal the fee
          value: BigNumber(5), // fee is 5 in createMockOperationView
        }),
      ],
    });
  });

  describe("a failed transfer instruction", () => {
    it("is a failed operation of no value on the sender's side", async () => {
      const shape = await syncRows([failed(createMockOperationView())]);

      expect(shape.operations).toEqual([
        expect.objectContaining({
          type: "FEES",
          value: BigNumber(0),
          fee: BigNumber(0),
          hasFailed: true,
        }),
      ]);
    });

    it("is a failed receive of no value", async () => {
      const shape = await syncRows([
        { ...failed(createMockOperationView({ type: "Receive" })), senders: ["bob"] },
      ]);

      expect(shape.operations).toEqual([
        expect.objectContaining({ type: "IN", value: BigNumber(0), hasFailed: true }),
      ]);
    });

    it("keeps the fee of a failed row with an amount, moving no value", async () => {
      const shape = await syncRows([{ ...createMockOperationView(), status: "Failed" }]);

      expect(shape.operations).toEqual([
        expect.objectContaining({
          type: "OUT",
          value: BigNumber(5),
          fee: BigNumber(5),
          hasFailed: true,
        }),
      ]);
    });

    it("leaves its sender and memo off a successful receive of the same transaction", async () => {
      const shape = await syncRows([
        failed(receive("uid-eve", "eve", "failed")),
        receive("uid-bob", "bob", "paid"),
      ]);

      expect(shape.operations).toEqual([
        expect.objectContaining({
          type: "IN",
          value: BigNumber(100),
          senders: ["bob"],
          hasFailed: false,
          extra: expect.objectContaining({ memo: "paid" }),
        }),
      ]);
    });

    it("leaves a successful transaction unflagged", async () => {
      const shape = await syncRows([createMockOperationView()]);

      expect(shape.operations).toEqual([
        expect.objectContaining({ value: BigNumber(105), hasFailed: false }),
      ]);
    });
  });

  it("should set operation type to TRANSFER_PROPOSAL when operationType is transfer-proposal", async () => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          txHash: "tx3",
          uid: "uid3",
          type: "Send",
          value: "200",
          operationType: "transfer-proposal",
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });
    expect(shape.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "TRANSFER_PROPOSAL",
          value: BigNumber(200),
          fee: BigNumber(0),
        }),
      ]),
    );
    expect(fees(shape)).toEqual([
      expect.objectContaining({ hash: "tx3", value: BigNumber(5), fee: BigNumber(5) }),
    ]);
  });

  it("should set operation type to TRANSFER_REJECTED when operationType is transfer-rejected", async () => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          txHash: "tx4",
          uid: "uid4",
          type: "Send",
          value: "150",
          operationType: "transfer-rejected",
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape: any = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });
    expect(shape).toMatchObject({
      operations: [
        expect.objectContaining({
          type: "TRANSFER_REJECTED",
          value: BigNumber(150), // transfer value only, fees not added for TRANSFER_REJECTED
        }),
      ],
    });
  });

  it("should set operation type to TRANSFER_WITHDRAWN when operationType is transfer-withdrawn", async () => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          txHash: "tx5",
          uid: "uid5",
          type: "Send",
          value: "50",
          operationType: "transfer-withdrawn",
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });
    expect(shape).toMatchObject({
      operations: [
        expect.objectContaining({
          type: "TRANSFER_WITHDRAWN",
          value: BigNumber(50), // transfer value only, fees not added for TRANSFER_WITHDRAWN
        }),
      ],
    });
  });

  it("should filter out operations that match pending transfer proposals", async () => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);

    mockedGetPendingTransferProposals.mockResolvedValue([
      {
        contract_id: "pending-proposal-uid",
        sender: "sender-party",
        receiver: "test-party-id",
        amount: "100",
        instrument_id: "Amulet",
        instrument_admin: "native-admin",
        memo: "Test proposal",
        expires_at_micros: Date.now() + 100000,
        update_id: "tx-pending",
      },
    ]);

    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          txHash: "tx-pending",
          uid: "pending-proposal-uid",
          type: "Receive",
          value: "100",
        }),
        createMockOperationView({
          txHash: "tx-completed",
          uid: "completed-uid",
          type: "Receive",
          value: "200",
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });

    expect(shape).toMatchObject({
      operations: [expect.objectContaining({ hash: "tx-completed", value: BigNumber(200) })],
      cantonResources: expect.objectContaining({
        pendingTransferProposals: [
          expect.objectContaining({ contract_id: "pending-proposal-uid" }),
        ],
      }),
    });
  });

  it("should expose token transfer proposals on parent account so the offer UI is reachable from the main view", async () => {
    // GIVEN
    // a pending token offer addressed to the user
    const tokenAdminId = "token-admin-party::1220abc";
    const tokenInstrumentId = "cbtc-instrument-id";
    const cbtcToken = {
      type: "TokenCurrency" as const,
      id: "canton_network/cip56/cbtc",
      contractAddress: tokenAdminId,
      parentCurrencyId: "canton_network",
      tokenType: "cip56",
      name: "CBTC",
      ticker: "CBTC",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "CBTC", code: "CBTC", magnitude: 8 }],
    };

    mockedGetCalTokensCached.mockResolvedValue(
      new Map([["canton_network/cip56/cbtc", tokenInstrumentId]]),
    );
    mockFindTokenById.mockImplementation(async (id: string) =>
      id === "canton_network/cip56/cbtc" ? cbtcToken : undefined,
    );
    mockedGetEnabledInstrumentsCached.mockResolvedValue(
      new Set([`${tokenInstrumentId}____${tokenAdminId}`]),
    );

    // No native balance, no token balance — the sub-account exists only because of the pending offer
    mockedGetBalance.mockResolvedValue([]);
    mockedGetOperations.mockResolvedValue({ operations: [] });
    mockedGetPendingTransferProposals.mockResolvedValue([
      {
        contract_id: "cbtc-offer-1",
        sender: "faucet-party",
        receiver: "test-party-id",
        amount: "1",
        instrument_id: tokenInstrumentId,
        instrument_admin: tokenAdminId,
        memo: "Faucet drop",
        expires_at_micros: (Date.now() + 100000) * 1000,
        update_id: "update-cbtc-1",
      },
    ]);

    // WHEN
    // we sync the account
    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(defaultInfo, { paginationConfig: {} });

    // THEN
    // the proposal lands on both the parent account and the token sub-account
    expect(shape.cantonResources?.pendingTransferProposals).toEqual([
      expect.objectContaining({ contract_id: "cbtc-offer-1", instrument_id: tokenInstrumentId }),
    ]);
    const subAccount = (shape.subAccounts as TokenAccount[] | undefined)?.[0] as
      | (TokenAccount & { cantonResources?: { pendingTransferProposals: unknown[] } })
      | undefined;
    expect(subAccount?.token.ticker).toBe("CBTC");
    expect(subAccount?.cantonResources?.pendingTransferProposals).toEqual([
      expect.objectContaining({ contract_id: "cbtc-offer-1" }),
    ]);
  });

  it("should sync without device when account has xpub but no publicKey", async () => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
    mockedGetOperations.mockResolvedValue({
      operations: [createMockOperationView()],
    });

    const infoWithXpub = createMockCantonAccountShapeInfo({
      initialAccount: {
        xpub: "test-party-id",
        cantonResources: {
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      } as unknown as CantonAccount,
    });
    delete infoWithXpub.deviceId;

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(infoWithXpub, { paginationConfig: {} });

    expect(shape).toHaveProperty("id");
    expect(shape.xpub).toBe("test-party-id");
    // Should not call getAddress since we have xpub
    expect(mockedResolver).not.toHaveBeenCalled();
  });

  it("backfills publicKey from the gateway when account has xpub but no publicKey (LIVE-34585)", async () => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
    mockedGetOperations.mockResolvedValue({ operations: [createMockOperationView()] });
    mockedGetPartyById.mockResolvedValue({
      party_id: "test-party-id",
      public_key: "backfilled-public-key",
    });

    const infoWithXpub = createMockCantonAccountShapeInfo({
      initialAccount: {
        xpub: "test-party-id",
        cantonResources: {
          isOnboarded: true,
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      } as unknown as CantonAccount,
    });
    delete infoWithXpub.deviceId;

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(infoWithXpub, { paginationConfig: {} });

    // Deviceless backfill: publicKey now resolves, so validateTopology can run.
    expect(mockedResolver).not.toHaveBeenCalled();
    expect(mockedGetPartyById).toHaveBeenCalledWith(sampleConfig, "test-party-id");
    expect(shape.cantonResources?.publicKey).toBe("backfilled-public-key");
  });

  it("should sync without device when account has publicKey but no xpub", async () => {
    mockedGetBalance.mockResolvedValue([]); // Empty balances since no xpub
    mockedGetOperations.mockResolvedValue({
      operations: [],
    });

    const infoWithPublicKey = createMockCantonAccountShapeInfo({
      initialAccount: {
        xpub: "", // Missing xpub
        cantonResources: {
          publicKey: "test-public-key",
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      } as unknown as CantonAccount,
    });
    delete infoWithPublicKey.deviceId;

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(infoWithPublicKey, { paginationConfig: {} });

    expect(shape).toHaveProperty("id");
    // Should not call getAddress since we have publicKey (even though xpub is missing)
    expect(mockedResolver).not.toHaveBeenCalled();
  });

  it("should sync without device when account has both xpub and publicKey", async () => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
    mockedGetOperations.mockResolvedValue({
      operations: [createMockOperationView()],
    });

    const infoWithBoth = createMockCantonAccountShapeInfo({
      initialAccount: {
        xpub: "test-party-id",
        cantonResources: {
          publicKey: "test-public-key",
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      } as unknown as CantonAccount,
    });
    delete infoWithBoth.deviceId;

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(infoWithBoth, { paginationConfig: {} });

    expect(shape).toHaveProperty("id");
    expect(shape.xpub).toBe("test-party-id");
    // Should not call getAddress since we have both values
    expect(mockedResolver).not.toHaveBeenCalled();
  });

  it("should correctly identify tokens with same adminId but different instrumentId", async () => {
    const sharedAdminId =
      "party-28dc4516-b5ca-44ff-86c7-2107e90a6807::1220b8301e18aa8a401d6e34e6c20f8b0243183c514373bca8f1b6b9270246341a9e";
    const sbcInstrumentId = "f29bdd7a-1469-498a-ba2a-796bf5387b31";
    const cusdInstrumentId = "481871d4-ca56-42a8-b2d3-4b7d28742946";

    // Create token mocks
    const sbcToken = {
      type: "TokenCurrency" as const,
      id: "canton_network/cip56/sbc",
      contractAddress: sharedAdminId,
      parentCurrencyId: "canton_network",
      tokenType: "cip56",
      name: "SBC",
      ticker: "SBC",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "SBC", code: "SBC", magnitude: 38 }],
    };

    const cusdToken = {
      type: "TokenCurrency" as const,
      id: "canton_network/cip56/cusd",
      contractAddress: sharedAdminId,
      parentCurrencyId: "canton_network",
      tokenType: "cip56",
      name: "CUSD",
      ticker: "CUSD",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "CUSD", code: "CUSD", magnitude: 38 }],
    };

    // Mock CAL tokens map (token_identifier -> token id)
    mockedGetCalTokensCached.mockResolvedValue(
      new Map([
        ["canton_network/cip56/sbc", sbcInstrumentId],
        ["canton_network/cip56/cusd", cusdInstrumentId],
      ]),
    );

    // Mock findTokenById to return correct tokens
    mockFindTokenById.mockImplementation(async (id: string) => {
      if (id === "canton_network/cip56/sbc") return sbcToken;
      if (id === "canton_network/cip56/cusd") return cusdToken;
      return undefined;
    });

    // Mock enabled instruments to include SBC (using SEPARATOR format)
    mockedGetEnabledInstrumentsCached.mockResolvedValue(
      new Set([`${sbcInstrumentId}____${sharedAdminId}`]),
    );

    // Mock balances with SBC token (NOT CUSD)
    mockedGetBalance.mockResolvedValue([
      createMockNativeBalance("1000"),
      {
        value: BigInt("990000000000000000000000000000000"),
        locked: BigInt(0),
        asset: { type: "token", assetReference: sbcInstrumentId },
        utxoCount: 1,
        isLocked: false,
        instrumentId: sbcInstrumentId,
        adminId: sharedAdminId,
      },
    ]);

    mockedGetOperations.mockResolvedValue({
      operations: [],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext, fakeContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });

    expect(shape).toMatchObject({
      subAccounts: [
        expect.objectContaining({
          balance: BigNumber("990000000000000000000000000000000"),
          type: "TokenAccount",
          token: expect.objectContaining({
            id: "canton_network/cip56/sbc",
            ticker: "SBC", // Should be SBC, not CUSD!
          }),
        }),
      ],
    });
  });

  describe("token attribution by instrument admin", () => {
    const instrumentId = "USDCx";
    const calAdmin = "decentralized-usdc-interchain-rep::1220aaaa";
    const otherAdmin = "impostor::1220bbbb";
    const usdcx = {
      type: "TokenCurrency" as const,
      id: "canton_network/cip56/usdcx",
      contractAddress: calAdmin,
      parentCurrencyId: "canton_network",
      tokenType: "cip56",
      name: "USDCx",
      ticker: "USDCx",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "USDCx", code: "USDCx", magnitude: 10 }],
    };
    const tokenBalance = (adminId: string, value: string, id = instrumentId): CantonBalance => ({
      value: BigInt(value),
      locked: 0n,
      asset: { type: "token", assetReference: id },
      utxoCount: 1,
      isLocked: false,
      instrumentId: id,
      adminId,
    });
    const proposalFrom = (adminId: string) => ({
      contract_id: `offer-from-${adminId}`,
      sender: "sender-party",
      receiver: "test-party-id",
      amount: "1",
      instrument_id: instrumentId,
      instrument_admin: adminId,
      memo: "",
      expires_at_micros: 4_102_444_800_000_000,
      update_id: `update-from-${adminId}`,
    });

    beforeEach(() => {
      mockedGetCalTokensCached.mockResolvedValue(new Map([[usdcx.id, instrumentId]]));
      mockFindTokenById.mockImplementation(async (id: string) =>
        id === usdcx.id ? usdcx : undefined,
      );
      mockedGetEnabledInstrumentsCached.mockResolvedValue(
        new Set([`${instrumentId}____${calAdmin}`]),
      );
      mockedGetOperations.mockResolvedValue({ operations: [] });
    });

    it("keeps only the CAL admin's balance and operations under the token", async () => {
      mockedGetBalance.mockResolvedValue([
        createMockNativeBalance("1000"),
        tokenBalance(otherAdmin, "900"),
        tokenBalance(calAdmin, "500"),
        { ...tokenBalance(calAdmin, "200"), locked: 200n, isLocked: true },
      ]);
      mockedGetOperations.mockResolvedValue({
        operations: [
          createMockOperationView({ txHash: "own-tx", instrumentId, instrumentAdmin: calAdmin }),
          createMockOperationView({
            txHash: "foreign-tx",
            instrumentId,
            instrumentAdmin: otherAdmin,
          }),
        ],
      });

      const shape = await sync();

      expect(shape.subAccounts).toEqual([
        expect.objectContaining({
          token: usdcx,
          balance: BigNumber(700),
          spendableBalance: BigNumber(500),
          operations: [expect.objectContaining({ hash: "own-tx" })],
        }),
      ]);
      expect(shape.cantonResources?.instrumentUtxoCounts).toEqual({
        Amulet: 1,
        [`${instrumentId}____${calAdmin}`]: 1,
        [`${instrumentId}____${otherAdmin}`]: 1,
      });
    });

    it("gives each admin's balance to its own CAL token when two share an instrument id", async () => {
      const otherUsdcx = {
        ...usdcx,
        id: "canton_network/cip56/usdcx-other",
        contractAddress: otherAdmin,
      };
      mockedGetCalTokensCached.mockResolvedValue(
        new Map([
          [usdcx.id, instrumentId],
          [otherUsdcx.id, instrumentId],
        ]),
      );
      mockFindTokenById.mockImplementation(async (id: string) =>
        [usdcx, otherUsdcx].find(token => token.id === id),
      );
      mockedGetEnabledInstrumentsCached.mockResolvedValue(
        new Set([`${instrumentId}____${calAdmin}`, `${instrumentId}____${otherAdmin}`]),
      );
      mockedGetBalance.mockResolvedValue([
        createMockNativeBalance("1000"),
        tokenBalance(otherAdmin, "900"),
        tokenBalance(calAdmin, "500"),
      ]);

      const shape = await sync();

      expect(shape.subAccounts).toEqual([
        expect.objectContaining({ token: otherUsdcx, balance: BigNumber(900) }),
        expect.objectContaining({ token: usdcx, balance: BigNumber(500) }),
      ]);
    });

    it("creates no token sub-account for a CAL token without an admin", async () => {
      mockFindTokenById.mockImplementation(async (id: string) =>
        id === usdcx.id ? { ...usdcx, contractAddress: "" } : undefined,
      );
      mockedGetBalance.mockResolvedValue([
        createMockNativeBalance("1000"),
        tokenBalance(calAdmin, "500"),
      ]);

      const shape = await sync();

      expect(shape.subAccounts).toEqual([]);
    });

    it("creates no token sub-account from another admin's balance", async () => {
      mockedGetBalance.mockResolvedValue([
        createMockNativeBalance("1000"),
        tokenBalance(otherAdmin, "900"),
      ]);

      const shape = await sync();

      expect(shape.subAccounts).toEqual([]);
    });

    it("creates no token sub-account from another admin's proposal", async () => {
      mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
      mockedGetPendingTransferProposals.mockResolvedValue([proposalFrom(otherAdmin)]);

      const shape = await sync();

      expect(shape.subAccounts).toEqual([]);
    });

    it("keeps another admin's proposal off the token sub-account", async () => {
      mockedGetBalance.mockResolvedValue([
        createMockNativeBalance("1000"),
        tokenBalance(calAdmin, "500"),
      ]);
      mockedGetPendingTransferProposals.mockResolvedValue([
        proposalFrom(otherAdmin),
        proposalFrom(calAdmin),
      ]);

      const shape = await sync();

      expect(shape.subAccounts).toEqual([
        expect.objectContaining({
          token: usdcx,
          cantonResources: { pendingTransferProposals: [proposalFrom(calAdmin)] },
        }),
      ]);
    });

    it("reads the native balance by its instrument id whatever row comes first", async () => {
      mockedGetBalance.mockResolvedValue([
        tokenBalance("unlisted-admin::1220cccc", "900", "UnlistedToken"),
        createMockNativeBalance("1000"),
      ]);

      const shape = await sync();

      expect(shape.balance).toEqual(BigNumber(1000));
    });

    describe("fee asset", () => {
      const usdcxInstrument = { instrumentId, instrumentAdmin: calAdmin };
      /** A proposal row the account sent, of CC or of USDCx. */
      const proposalRow = (txHash: string, instrument = { instrumentId: "Amulet" }) => ({
        ...createMockOperationView({ txHash, operationType: "transfer-proposal", ...instrument }),
        ...(instrument.instrumentId === "Amulet"
          ? {}
          : { asset: { type: "token" as const, ...usdcxInstrument } }),
      });
      const pendingProposal = (updateId: string, instrument_id = "Amulet") => ({
        ...proposalFrom(instrument_id === "Amulet" ? "native-admin" : calAdmin),
        contract_id: `offer-${updateId}`,
        sender: "party123",
        receiver: "bob",
        amount: "100",
        instrument_id,
        update_id: updateId,
      });

      beforeEach(() => {
        mockedGetBalance.mockResolvedValue([
          createMockNativeBalance("1000"),
          tokenBalance(calAdmin, "500"),
        ]);
      });

      it("keeps the CC fee of a token send out of the token, and charges it on the main account", async () => {
        mockedGetOperations.mockResolvedValue({
          operations: [tokenOperationView(usdcxInstrument, "token-tx")],
        });

        const shape = await sync();

        expect(shape.subAccounts?.[0].operations).toEqual([
          expect.objectContaining({ type: "OUT", value: BigNumber(100), fee: BigNumber(0) }),
        ]);
        expect(fees(shape)).toEqual([
          expect.objectContaining({
            hash: "token-tx",
            value: BigNumber(5),
            fee: BigNumber(5),
            senders: ["party123"],
            extra: expect.objectContaining({ instrumentId: "Amulet" }),
          }),
        ]);
      });

      it("charges the CC fee of a token send on the CC send of the same transaction", async () => {
        mockedGetOperations.mockResolvedValue({
          operations: [
            tokenOperationView(usdcxInstrument, "mixed-tx"),
            createMockOperationView({ txHash: "mixed-tx" }),
          ],
        });

        const shape = await sync();

        expect(shape.operations).toEqual([
          expect.objectContaining({ type: "OUT", value: BigNumber(110), fee: BigNumber(10) }),
        ]);
      });

      describe("of a failed transfer instruction", () => {
        const inOrder = [
          ["token row first", (token: OperationInfo, cc: OperationInfo) => [token, cc]],
          ["CC row first", (token: OperationInfo, cc: OperationInfo) => [cc, token]],
        ] as const;

        it.each(inOrder)(
          "flags the failed token instruction only, not its successful CC sibling (%s)",
          async (_, order) => {
            mockedGetOperations.mockResolvedValue({
              operations: order(
                failed(tokenOperationView(usdcxInstrument, "mixed-tx")),
                createMockOperationView({ txHash: "mixed-tx" }),
              ),
            });

            const shape = await sync();

            expect(shape.subAccounts?.[0].operations).toEqual([
              expect.objectContaining({ value: BigNumber(0), fee: BigNumber(0), hasFailed: true }),
            ]);
            expect(shape.operations).toEqual([
              expect.objectContaining({
                type: "OUT",
                value: BigNumber(105),
                fee: BigNumber(5),
                hasFailed: false,
              }),
            ]);
          },
        );

        it.each(inOrder)(
          "unflags the CC FEES operation that charges a successful token send's fee (%s)",
          async (_, order) => {
            mockedGetOperations.mockResolvedValue({
              operations: order(
                tokenOperationView(usdcxInstrument, "mixed-tx"),
                failed(createMockOperationView({ txHash: "mixed-tx" })),
              ),
            });

            const shape = await sync();

            expect(shape.operations).toEqual([
              expect.objectContaining({
                type: "FEES",
                value: BigNumber(5),
                fee: BigNumber(5),
                senders: ["party123"],
                recipients: [],
                hasFailed: false,
              }),
            ]);
            expect(shape.subAccounts?.[0].operations).toEqual([
              expect.objectContaining({ value: BigNumber(100), hasFailed: false }),
            ]);
          },
        );
      });

      it("keeps one operation per asset for a send to several receivers, with every fee", async () => {
        mockedGetOperations.mockResolvedValue({
          operations: [
            tokenOperationView(usdcxInstrument, "split-tx", { uid: "uid-1", recipients: ["bob"] }),
            tokenOperationView(usdcxInstrument, "split-tx", {
              uid: "uid-2",
              recipients: ["carol"],
            }),
          ],
        });

        const shape = await sync();

        expect(shape.subAccounts?.[0].operations).toEqual([
          expect.objectContaining({ value: BigNumber(200), recipients: ["bob", "carol"] }),
        ]);
        expect(fees(shape)).toEqual([expect.objectContaining({ value: BigNumber(10) })]);
      });

      it.each([
        ["keeps the memo the rows share", "lunch", "lunch", "lunch"],
        ["keeps the memo of the only row with one", "lunch", undefined, "lunch"],
        ["leaves no memo when the rows disagree", "lunch", "rent", undefined],
      ])("%s", async (_, firstMemo, secondMemo, expected) => {
        mockedGetOperations.mockResolvedValue({
          operations: [
            tokenRowWithMemo(usdcxInstrument, "uid-1", firstMemo),
            tokenRowWithMemo(usdcxInstrument, "uid-2", secondMemo),
          ],
        });

        const shape = await sync();

        expect(shape.subAccounts?.[0].operations[0].extra).toEqual(
          expect.objectContaining({ memo: expected }),
        );
      });

      it("rebuilds a token sub-account without its stale operations, keeping its pending operations and regenerating its chart", async () => {
        const staleChart = { HOUR: { latestDate: 1, balances: [42] } };
        const pendingOperations = [
          { ...storedOperation(10), id: "pending", hash: "pending", date: new Date() },
        ];
        mockedGetOperations.mockResolvedValue({
          operations: [tokenOperationView(usdcxInstrument, "fresh-token")],
          next: -1,
        });
        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: sampleCurrency.id,
          xpubOrAddress: "party123",
          derivationMode: "canton",
        });

        const account = await syncAccount(undefined, {
          id: accountId,
          subAccounts: [
            {
              type: "TokenAccount",
              id: encodeTokenAccountId(accountId, usdcx as TokenAccount["token"]),
              parentId: accountId,
              token: usdcx,
              balance: BigNumber(500),
              spendableBalance: BigNumber(500),
              creationDate: new Date(0),
              operations: [{ ...storedOperation(9), id: "stale-token" }],
              operationsCount: 1,
              pendingOperations,
              balanceHistoryCache: staleChart,
              swapHistory: [],
            },
          ] as unknown as TokenAccount[],
        });

        const [subAccount] = account.subAccounts ?? [];
        expect(subAccount.operations.map(op => op.hash)).toEqual(["fresh-token"]);
        expect(subAccount.pendingOperations).toEqual(pendingOperations);
        expect(subAccount.balanceHistoryCache).not.toEqual(staleChart);
        expect(subAccount.balanceHistoryCache).not.toEqual(emptyHistoryCache);
      });

      it("charges no fee for a token the account received", async () => {
        mockedGetOperations.mockResolvedValue({
          operations: [
            tokenOperationView(usdcxInstrument, "in-tx", { type: "Receive", senders: ["alice"] }),
          ],
        });

        const shape = await sync();

        expect(shape.subAccounts?.[0].operations).toEqual([
          expect.objectContaining({ type: "IN", value: BigNumber(100) }),
        ]);
        expect(shape.operations).toEqual([]);
      });

      it("keeps one operation per token for a transaction sending two tokens, and charges both CC fees once", async () => {
        const cbtc = {
          ...usdcx,
          id: "canton_network/cip56/cbtc",
          contractAddress: "cbtc-admin::1220eeee",
          name: "CBTC",
          ticker: "CBTC",
        };
        const cbtcInstrument = { instrumentId: "CBTC", instrumentAdmin: cbtc.contractAddress };
        mockedGetCalTokensCached.mockResolvedValue(
          new Map([
            [usdcx.id, instrumentId],
            [cbtc.id, "CBTC"],
          ]),
        );
        mockFindTokenById.mockImplementation(async (id: string) =>
          [usdcx, cbtc].find(token => token.id === id),
        );
        mockedGetEnabledInstrumentsCached.mockResolvedValue(
          new Set([`${instrumentId}____${calAdmin}`, `CBTC____${cbtc.contractAddress}`]),
        );
        mockedGetBalance.mockResolvedValue([
          createMockNativeBalance("1000"),
          tokenBalance(calAdmin, "500"),
          tokenBalance(cbtc.contractAddress, "300", "CBTC"),
        ]);
        mockedGetOperations.mockResolvedValue({
          operations: [
            tokenOperationView(usdcxInstrument, "two-tokens", { uid: "uid-1" }),
            tokenOperationView(cbtcInstrument, "two-tokens", {
              uid: "uid-2",
              transfers: [
                {
                  address: "party123",
                  type: "Send",
                  value: "40",
                  asset: "CBTC",
                  details: { operationType: "transfer" },
                },
              ],
            } as Partial<OperationInfo>),
          ],
        });

        const shape = await sync();

        const tokenOperations = (shape.subAccounts ?? []).map(({ token, operations }) => [
          token.id,
          operations.map(({ type, value, fee }) => [type, value.toString(), fee.toString()]),
        ]);
        expect(tokenOperations).toEqual(
          expect.arrayContaining([
            [usdcx.id, [["OUT", "100", "0"]]],
            [cbtc.id, [["OUT", "40", "0"]]],
          ]),
        );
        expect(tokenOperations).toHaveLength(2);
        expect(fees(shape)).toEqual([
          expect.objectContaining({ hash: "two-tokens", value: BigNumber(10) }),
        ]);
      });

      describe("transfer proposals", () => {
        it("charges the fees of a pending proposal the account sent, without the proposal", async () => {
          mockedGetPendingTransferProposals.mockResolvedValue([pendingProposal("offer-tx")]);
          mockedGetOperations.mockResolvedValue({
            operations: [
              proposalRow("offer-tx"),
              createMockOperationView({ txHash: "offer-tx", uid: "change" }),
            ],
          });

          const shape = await sync();

          expect(shape.operations).toEqual([
            expect.objectContaining({
              hash: "offer-tx",
              type: "FEES",
              value: BigNumber(10),
              fee: BigNumber(10),
            }),
          ]);
        });

        it("records nothing for a pending proposal the account received", async () => {
          mockedGetPendingTransferProposals.mockResolvedValue([pendingProposal("offer-tx")]);
          mockedGetOperations.mockResolvedValue({
            operations: [{ ...proposalRow("offer-tx"), type: "Receive", senders: ["alice"] }],
          });

          const shape = await sync();

          expect(shape.operations).toEqual([]);
        });

        it("charges the CC fee of a pending token proposal on the main account", async () => {
          mockedGetPendingTransferProposals.mockResolvedValue([
            pendingProposal("token-offer", instrumentId),
          ]);
          mockedGetOperations.mockResolvedValue({
            operations: [proposalRow("token-offer", usdcxInstrument)],
          });

          const shape = await sync();

          expect(shape.subAccounts?.[0].operations).toEqual([]);
          expect(shape.operations).toEqual([
            expect.objectContaining({
              hash: "token-offer",
              type: "FEES",
              value: BigNumber(5),
              extra: expect.objectContaining({ instrumentId: "Amulet" }),
            }),
          ]);
        });

        it("charges the fee of a settled proposal once, on its creation", async () => {
          mockedGetOperations.mockResolvedValue({
            operations: [
              proposalRow("offer-tx"),
              {
                ...createMockOperationView({ txHash: "accept-tx" }),
                fee: { ...createMockOperationView().fee, value: "0" },
              },
            ],
          });

          const shape = await sync();

          expect(shape.operations).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ type: "TRANSFER_PROPOSAL", fee: BigNumber(0) }),
              expect.objectContaining({ hash: "accept-tx", type: "OUT", value: BigNumber(100) }),
            ]),
          );
          expect(fees(shape)).toEqual([
            expect.objectContaining({ hash: "offer-tx", value: BigNumber(5) }),
          ]);
        });
      });

      describe("a token that gets its sub-account", () => {
        const accountId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: sampleCurrency.id,
          xpubOrAddress: "party123",
          derivationMode: "canton",
        });
        const storedUsdcx = {
          type: "TokenAccount",
          id: encodeTokenAccountId(accountId, usdcx as TokenAccount["token"]),
          parentId: accountId,
          token: usdcx,
          balance: BigNumber(500),
          spendableBalance: BigNumber(500),
          creationDate: new Date(0),
          operations: [],
          operationsCount: 0,
          pendingOperations: [],
          balanceHistoryCache: emptyHistoryCache,
          swapHistory: [],
        } as unknown as TokenAccount;
        const rows = [
          {
            ...tokenOperationView(usdcxInstrument, "early-token"),
            block: { height: 10, time: "" },
          },
          { ...createMockOperationView({ txHash: "late" }), block: { height: 20, time: "" } },
        ];

        beforeEach(() => {
          mockedGetOperations.mockImplementation(async (_config, _party, { minOffset }) => ({
            operations: rows.filter(row => row.block.height >= minOffset),
            next: -1,
          }));
        });

        it("reads the history again from offset 0, recovering a CC fee older than every stored operation", async () => {
          const account = await syncAccount(SYNC_HASH, {
            id: accountId,
            operations: [storedOperation(20)],
            cantonResources: resourcesUpTo({ hash: "early-token", height: 10 }),
          });

          expect(readFrom()).toEqual([expect.objectContaining({ minOffset: 0 })]);
          expect(checkpointOf(account)).toEqual({ hash: "late", height: 20 });
          expect(account.operations.map(op => op.hash).sort()).toEqual(["early-token", "late"]);
          expect(fees(account)).toEqual([
            expect.objectContaining({ hash: "early-token", value: BigNumber(5) }),
          ]);
          expect(account.subAccounts?.[0].operations.map(op => op.hash)).toEqual(["early-token"]);
        });

        it("keeps the fees of a settled offer the rebuild does not read in full, until it does", async () => {
          let served = [...offerRows("offer", 5), ...rows];
          mockedGetOperations.mockImplementation(async (_config, _party, { minOffset }) => ({
            operations: served.filter(row => row.block.height >= minOffset),
            next: -1,
          }));
          mockedGetPendingTransferProposals.mockResolvedValue([sentOffer("offer")]);
          const pending = await syncFrom({
            syncHash: SYNC_HASH,
            subAccounts: [storedUsdcx],
            cantonResources: {} as never,
          });
          expect(feesOf(pending, "offer")).toEqual([
            expect.objectContaining({ value: BigNumber(10) }),
          ]);
          expect(replayOf(pending)).toEqual([{ hash: "offer", height: 5 }]);

          mockedGetPendingTransferProposals.mockResolvedValue([]);
          served = [...offerRows("offer", 5).map(row => ({ ...row, transfers: [] })), ...rows];
          const rebuilt = await syncAfter({ ...pending, subAccounts: [] }, SYNC_HASH);
          expect(rebuilt.from).toEqual([0]);
          expect(feesOf(rebuilt.shape, "offer")).toEqual([
            expect.objectContaining({ value: BigNumber(10) }),
          ]);
          expect(replayOf(rebuilt.shape)).toEqual([{ hash: "offer", height: 5 }]);
          expect(rebuilt.shape.subAccounts?.[0].operations.map(op => op.hash)).toEqual([
            "early-token",
          ]);

          served = [...offerRows("offer", 5), ...rows];
          expect(checkpointOf(rebuilt.shape)).toBeUndefined();
          const recovered = await resync(rebuilt.shape);
          expect(recovered.from).toEqual([0]);
          expect(feesOf(recovered.shape, "offer")).toEqual([]);
          expect(feeOf(recovered.shape, "offer")).toEqual(BigNumber(10));
          expect(replayOf(recovered.shape)).toEqual([]);
          expect(checkpointOf(recovered.shape)).toEqual({ hash: "late", height: 20 });
        });

        it("leaves the account as it was when a later page of the history fails", async () => {
          const account = {
            id: accountId,
            operations: [storedOperation(20)],
            cantonResources: resourcesUpTo({ hash: "late", height: 20 }),
          };
          mockedGetOperations
            .mockResolvedValueOnce({ operations: [rows[0]], next: 15 })
            .mockRejectedValueOnce(new Error("gateway"));
          await expect(syncAccount(SYNC_HASH, account)).rejects.toThrow("gateway");
          mockedGetOperations.mockClear();

          const retried = await syncAccount(SYNC_HASH, account);
          expect(readFrom()).toEqual([expect.objectContaining({ minOffset: 0 })]);
          expect(retried.operations.map(op => op.hash).sort()).toEqual(["early-token", "late"]);
          expect(checkpointOf(retried)).toEqual({ hash: "late", height: 20 });
        });

        describe("after a restore that does not find a token", () => {
          const restoreFinding = async (foundTokens: (typeof usdcx)[]) => {
            const tokenIds = foundTokens.map(({ id }) => id);
            const synced = await syncAccount(SYNC_HASH, { id: accountId });
            const found = synced.subAccounts?.filter(({ token }) => tokenIds.includes(token.id));
            const notFound = { ...storedUsdcx, token: { ...usdcx, id: "not-found" } };
            const saved = { ...synced, subAccounts: [...(found ?? []), notFound] } as Account;
            const raw = toAccountRaw(saved, { assignToAccountRaw });
            const restored = (await fromAccountRaw(raw, { assignFromAccountRaw })) as CantonAccount;
            expect(restored.operations).toEqual([]);
            expect(checkpointOf(restored)).toEqual({ hash: "late", height: 20 });

            mockedGetBalance.mockResolvedValue([
              createMockNativeBalance("1000"),
              ...foundTokens.map(() => tokenBalance(calAdmin, "500")),
            ]);
            mockedGetOperations.mockClear();
            return restored;
          };

          it.each([
            ["without another token", []],
            ["next to a token that is found", [usdcx]],
          ])("reads the history again from offset 0, %s", async (_, foundTokens) => {
            const account = await syncAccount(SYNC_HASH, await restoreFinding(foundTokens));

            expect(readFrom()).toEqual([expect.objectContaining({ minOffset: 0 })]);
            expect(account.operations.map(op => op.hash).sort()).toEqual(["early-token", "late"]);
            expect(fees(account)).toEqual([
              expect.objectContaining({ hash: "early-token", value: BigNumber(5) }),
            ]);
            expect(
              account.subAccounts?.map(({ token, operations }) => [token, operations.length]),
            ).toEqual(foundTokens.map(token => [token, 1]));
            expect(checkpointOf(account)).toEqual({ hash: "late", height: 20 });
          });

          it("keeps the operations of a token that is found when the read leaves them out", async () => {
            const restored = await restoreFinding([usdcx]);
            serveRows(() => [rows[1]]);

            const account = await syncAccount(SYNC_HASH, restored);
            expect(account.subAccounts?.[0].operations.map(op => op.hash)).toEqual(["early-token"]);
          });
        });

        it("reads the history again from offset 0 after a clear, when only the token had operations", async () => {
          const received = { type: "Receive" as const, senders: ["alice"] };
          serveRows(() => [at(tokenOperationView(usdcxInstrument, "token-in", received), 10)]);
          const synced = await syncAccount(SYNC_HASH, {
            id: accountId,
            operations: [],
            operationsCount: 0,
          });
          expect(synced.operations).toEqual([]);
          expect(checkpointOf(synced)).toEqual({ hash: "token-in", height: 10 });

          mockedGetOperations.mockClear();
          const account = await syncAccount(SYNC_HASH, clearAccount(synced));
          expect(readFrom()).toEqual([expect.objectContaining({ minOffset: 0 })]);
          expect(account.subAccounts?.[0].operations.map(op => op.hash)).toEqual(["token-in"]);
        });

        it("reads on from the checkpoint once the sub-account is stored", async () => {
          await syncAccount(SYNC_HASH, {
            id: accountId,
            operations: [storedOperation(20)],
            subAccounts: [storedUsdcx],
            cantonResources: resourcesUpTo({ hash: "late", height: 20 }),
          });

          expect(readFrom()).toEqual([expect.objectContaining({ minOffset: 20 })]);
        });

        it("does not read the history again for a held token that stays disabled", async () => {
          mockedGetEnabledInstrumentsCached.mockResolvedValue(new Set());

          const account = {
            id: accountId,
            operations: [storedOperation(20)],
            cantonResources: resourcesUpTo({ hash: "late", height: 20 }),
          };
          await syncAccount(SYNC_HASH, account);
          await syncAccount(SYNC_HASH, account);

          expect(readFrom()).toEqual([
            expect.objectContaining({ minOffset: 20 }),
            expect.objectContaining({ minOffset: 20 }),
          ]);
        });
      });
    });
  });

  describe("history reading", () => {
    beforeEach(() => {
      mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
      mockedGetOperations.mockResolvedValue({ operations: [], next: -1 });
    });

    describe("scan checkpoint", () => {
      const droppedToken = { instrumentId: "Unlisted", instrumentAdmin: "unlisted-admin" };
      const first = at(createMockOperationView({ txHash: "first" }), 5);
      const droppedTokenRow = at(tokenOperationView(droppedToken, "token-tx"), 8);
      const invalidRow = {
        ...at(createMockOperationView({ txHash: "invalid" }), 9),
        transfers: [],
      };
      const later = at(createMockOperationView({ txHash: "later" }), 12);
      let rows: OperationInfo[] = [];

      beforeEach(() => {
        rows = [first, withoutFee(droppedTokenRow), invalidRow];
        serveRows(() => rows);
      });

      it("passes a tail of rows that produce no stored operation", async () => {
        const synced = await syncFirst();
        expect(hashesOf(synced)).toEqual(["first"]);
        expect(checkpointOf(synced)).toEqual({ hash: "invalid", height: 9 });

        rows = [...rows, later];
        const next = await resync(synced);
        expect(next.from).toEqual([9]);
        expect(hashesOf(next.shape)).toEqual(["later", "first"]);
        expect(checkpointOf(next.shape)).toEqual({ hash: "later", height: 12 });
      });

      it("keeps the operations and the checkpoint when nothing is new", async () => {
        rows = [first];
        const synced = await syncFirst();

        const idle = await resync(synced);
        expect(idle.from).toEqual([5]);
        expect(idle.shape.operations).toEqual(synced.operations);
        expect(checkpointOf(idle.shape)).toEqual({ hash: "first", height: 5 });
      });

      it("stores the checkpoint's transaction once it comes back valid", async () => {
        const synced = await syncFirst();

        rows = [first, at(createMockOperationView({ txHash: "invalid" }), 9)];
        const next = await resync(synced);
        expect(hashesOf(next.shape)).toEqual(["invalid", "first"]);
      });

      it("reads from offset 0 without a checkpoint, keeping the stored operations", async () => {
        rows = [first, later];
        const shape = await syncFrom({
          syncHash: SYNC_HASH,
          operations: [storedOperation(10)],
          cantonResources: {} as never,
        });

        expect(readFrom()).toEqual([{ minOffset: 0, maxOffset: 12345, limit: 1000 }]);
        expect(hashesOf(shape)).toEqual(["later", "first", "stored-10"]);
        expect(checkpointOf(shape)).toEqual({ hash: "later", height: 12 });
      });

      it("reads every page by the configured page size", async () => {
        rows = [first, later];
        mockedGetOperations.mockImplementation(async (_config, _party, options) => {
          const start = options?.cursor ?? options?.minOffset ?? 0;
          const limit = options?.limit ?? Infinity;
          const pending = rows.filter(({ block }) => block.height >= start);
          const page = pending.slice(0, limit);
          const unserved = pending[page.length];
          return { operations: page, next: unserved ? unserved.block.height + 1 : -1 };
        });
        const pagedConfig = { ...sampleConfig, gateway: { maxTxQuery: 1 } };
        const shape = await syncFrom(
          { syncHash: SYNC_HASH, operations: [], cantonResources: {} as never },
          { ...fakeContext, config: async () => pagedConfig } as unknown as CantonContext,
        );

        expect(readFrom()).toEqual([
          { minOffset: 0, maxOffset: 12345, cursor: undefined, limit: 1 },
          { minOffset: 0, maxOffset: 12345, cursor: 6, limit: 1 },
        ]);
        expect(hashesOf(shape)).toEqual(["later", "first"]);
      });

      it("reads the whole history again after the account is cleared", async () => {
        rows = [first, later];
        const synced = await syncFirst();
        const cleared = clearAccount({
          ...createMockCantonAccount(),
          ...synced,
          subAccounts: [],
        } as CantonAccount);
        expect(checkpointOf(cleared)).toEqual({ hash: "later", height: 12 });

        mockedGetOperations.mockClear();
        const shape = await syncFrom(cleared);
        expect(readFrom()).toEqual([expect.objectContaining({ minOffset: 0 })]);
        expect(hashesOf(shape)).toEqual(["later", "first"]);
      });

      it("bypasses the checkpoint when the sync hash changed, and replaces it", async () => {
        rows = [first, later];
        const { shape, from } = await syncAfter(
          {
            operations: [storedOperation(5, 999)],
            cantonResources: resourcesUpTo({ hash: "first", height: 5 }),
          },
          undefined,
        );

        expect(from).toEqual([0]);
        expect(hashesOf(shape)).toEqual(["later", "first"]);
        expect(checkpointOf(shape)).toEqual({ hash: "later", height: 12 });
      });

      it.each([
        ["an incremental sync", SYNC_HASH, 5],
        ["a rebuild", undefined, 0],
      ])(
        "leaves the account as it was when a later page of %s fails",
        async (_, syncHash, from) => {
          const account = {
            operations: [storedOperation(5)],
            cantonResources: resourcesUpTo({ hash: "first", height: 5 }),
          };
          mockedGetOperations
            .mockResolvedValueOnce({ operations: [first], next: 9 })
            .mockRejectedValueOnce(new Error("gateway"));
          await expect(syncAfter(account, syncHash)).rejects.toThrow("gateway");

          rows = [first, later];
          const retried = await syncAfter(account, syncHash);
          expect(retried.from).toEqual([from]);
          expect(hashesOf(retried.shape)).toContain("later");
          expect(checkpointOf(retried.shape)).toEqual({ hash: "later", height: 12 });
        },
      );

      it("takes a second page for the checkpoint's transaction and a full page after it", async () => {
        mockedGetOperations
          .mockResolvedValueOnce({ operations: [first], next: 13 })
          .mockResolvedValueOnce({ operations: [later], next: -1 });

        const { shape } = await resync({
          cantonResources: resourcesUpTo({ hash: "first", height: 5 }),
        });

        expect(readFrom()).toEqual([
          { minOffset: 5, maxOffset: 12345, limit: 1000 },
          { minOffset: 5, maxOffset: 12345, cursor: 6, limit: 1000 },
        ]);
        expect(checkpointOf(shape)).toEqual({ hash: "later", height: 12 });
      });

      describe("from another node, whose offsets differ", () => {
        const missed = createMockOperationView({ txHash: "missed" });
        const onOtherNode = (height: number) => [
          at(createMockOperationView({ txHash: "first" }), height),
          at(missed, height + 1),
        ];

        it.each([
          ["above the checkpoint", 20],
          ["below the checkpoint", 1],
        ])("reads from offset 0 when its rows are %s", async (_, height) => {
          rows = [first];
          const synced = await syncFirst();

          rows = onOtherNode(height);
          const switched = await resync(synced);
          expect(switched.from).toEqual([5, 0]);
          expect(hashesOf(switched.shape)?.sort()).toEqual(["first", "missed"]);
          expect(checkpointOf(switched.shape)).toEqual({ hash: "missed", height: height + 1 });

          rows = [first, at(missed, 7)];
          const back = await resync(switched.shape);
          expect(back.from.at(-1)).toBe(0);
          expect(hashesOf(back.shape)?.sort()).toEqual(["first", "missed"]);
          expect(checkpointOf(back.shape)).toEqual({ hash: "missed", height: 7 });
        });

        it("reads from offset 0 when another transaction is at the checkpoint's offset", async () => {
          rows = [first];
          const synced = await syncFirst();

          rows = [at(missed, 3), at(createMockOperationView({ txHash: "other" }), 5)];
          const switched = await resync(synced);
          expect(switched.from).toEqual([5, 0]);
          expect(hashesOf(switched.shape)?.sort()).toEqual(["first", "missed", "other"]);
        });

        it("reads from offset 0 when its ledger end is below the checkpoint", async () => {
          rows = [first, later];
          const synced = await syncFirst();

          mockedGetLedgerEnd.mockResolvedValueOnce(11);
          rows = onOtherNode(3);
          const switched = await resync(synced);
          expect(switched.from).toEqual([0]);
          expect(hashesOf(switched.shape)?.sort()).toEqual(["first", "later", "missed"]);
        });

        it("keeps the history when the node does not host the account", async () => {
          rows = [first, later];
          const synced = await syncFirst();

          rows = [];
          const empty = await resync(synced);
          expect(hashesOf(empty.shape)).toEqual(["later", "first"]);
          expect(checkpointOf(empty.shape)).toBeUndefined();

          rows = [first, later];
          const back = await resync(empty.shape);
          expect(back.from).toEqual([0]);
          expect(checkpointOf(back.shape)).toEqual({ hash: "later", height: 12 });
        });

        it("does not add an operation when a stored transaction comes back as another type", async () => {
          rows = [first];
          const synced = await syncFirst();
          expect(synced.operations?.map(({ type }) => type)).toEqual(["OUT"]);

          rows = [at(createMockOperationView({ txHash: "first", value: "0" }), 20)];
          const switched = await resync(synced);
          expect(switched.shape.operations).toEqual(synced.operations);
        });
      });
    });

    it("reads the checkpoint's transaction alone when the account is at the ledger end", async () => {
      mockedGetOperations.mockResolvedValue({
        operations: [rowAtHeight("newest", 12345)],
        next: -1,
      });

      await resync({ cantonResources: resourcesUpTo({ hash: "newest", height: 12345 }) });

      expect(readFrom()).toEqual([{ minOffset: 12345, maxOffset: 12345, limit: 1000 }]);
    });

    it("reads every page, resuming after the last row served rather than at the gateway's next", async () => {
      mockedGetOperations
        .mockResolvedValueOnce({ operations: [rowAtHeight("first", 1)], next: 5 })
        .mockResolvedValueOnce({ operations: [], next: 9 })
        .mockResolvedValueOnce({ operations: [rowAtHeight("second", 8)], next: -1 });

      const shape = await syncFrom({ syncHash: SYNC_HASH });

      expect(readFrom()).toEqual([
        { minOffset: 0, maxOffset: 12345, limit: 1000 },
        { minOffset: 0, maxOffset: 12345, cursor: 2, limit: 1000 },
        { minOffset: 0, maxOffset: 12345, cursor: 8, limit: 1000 },
      ]);
      expect(shape.operations?.map(op => op.hash).sort()).toEqual(["first", "second"]);
    });

    it("stops at the ledger end read before the walk", async () => {
      mockedGetOperations.mockResolvedValueOnce({
        operations: [{ ...createMockOperationView(), block: { height: 12345, time: "" } }],
        next: 12347,
      });

      await syncFrom({ syncHash: SYNC_HASH });

      expect(mockedGetOperations).toHaveBeenCalledTimes(1);
    });

    describe("pending offers read again", () => {
      const earlierRow = at(createMockOperationView({ txHash: "earlier" }), 2);
      const belowOffers = { hash: "earlier", height: 2 };
      const laterRow = at(createMockOperationView({ txHash: "later" }), 9);
      let rows: OperationInfo[] = [];

      beforeEach(() => {
        rows = offerRows("offer", 5);
        serveRows(() => [earlierRow, ...rows]);
        mockedGetPendingTransferProposals.mockResolvedValue([sentOffer("offer")]);
      });

      it("replaces the fees stored while pending once the offer settles, and reads on", async () => {
        const pending = await syncPending();

        mockedGetPendingTransferProposals.mockResolvedValue([]);
        rows = [...offerRows("offer", 5), laterRow];
        expect(checkpointOf(pending)).toEqual(belowOffers);
        const settled = await resync(pending);
        expect(settled.from).toEqual([2]);
        expect(feesOf(settled.shape, "offer")).toEqual([]);
        expect(
          settled.shape.operations?.filter(op => op.hash === "offer").map(op => op.type),
        ).toEqual(expect.arrayContaining(["TRANSFER_PROPOSAL", "OUT"]));
        expect(feeOf(settled.shape, "offer")).toEqual(BigNumber(10));
        expect(replayOf(settled.shape)).toEqual([]);

        expect(checkpointOf(settled.shape)).toEqual({ hash: "later", height: 9 });
        const next = await resync(settled.shape);
        expect(next.from).toEqual([9]);
      });

      it("replaces the fees stored while only part of the offer was valid, once it settles", async () => {
        const [validRow, otherRow] = offerRows("offer", 5);
        rows = [validRow, { ...otherRow, transfers: [] }];
        const pending = await syncFirst();
        expect(feesOf(pending, "offer")).toEqual([expect.objectContaining({ fee: BigNumber(5) })]);
        expect(replayOf(pending)).toEqual([{ hash: "offer", height: 5 }]);

        mockedGetPendingTransferProposals.mockResolvedValue([]);
        rows = [...offerRows("offer", 5), laterRow];
        const settled = await resync(pending);
        expect(feesOf(settled.shape, "offer")).toEqual([]);
        expect(feeOf(settled.shape, "offer")).toEqual(BigNumber(10));
        expect(replayOf(settled.shape)).toEqual([]);
      });

      it("keeps the fees of a settled offer the gateway does not read in full, until it does", async () => {
        const pending = await syncPending();
        mockedGetPendingTransferProposals.mockResolvedValue([]);
        const invalid = offerRows("offer", 5).map(row => ({ ...row, transfers: [] }));

        let previous: Partial<CantonAccount> = pending;
        for (const partial of [[], invalid, [offerRows("offer", 5)[0], invalid[1]]]) {
          rows = [...partial, laterRow];
          const { shape, from } = await resync(previous);
          expect(from).toEqual([2]);
          expect(checkpointOf(shape)).toEqual(belowOffers);
          expect(feesOf(shape, "offer")).toEqual([
            expect.objectContaining({ value: BigNumber(10) }),
          ]);
          expect(replayOf(shape)).toEqual([{ hash: "offer", height: 5 }]);
          expect(shape.operations?.map(op => op.hash)).toContain("later");
          previous = shape;
        }

        rows = [...offerRows("offer", 5), laterRow];
        const recovered = await resync(previous);
        expect(feesOf(recovered.shape, "offer")).toEqual([]);
        expect(feeOf(recovered.shape, "offer")).toEqual(BigNumber(10));
        expect(replayOf(recovered.shape)).toEqual([]);
      });

      it("keeps the fees when the transaction read again charges less than they did", async () => {
        const pending = await syncPending();
        mockedGetPendingTransferProposals.mockResolvedValue([]);

        rows = [offerRows("offer", 5)[1]];
        const partial = await resync(pending);
        expect(feesOf(partial.shape, "offer")).toEqual([
          expect.objectContaining({ value: BigNumber(10) }),
        ]);
        expect(feeOf(partial.shape, "offer")).toEqual(BigNumber(10));
        expect(replayOf(partial.shape)).toEqual([{ hash: "offer", height: 5 }]);

        rows = offerRows("offer", 5);
        const recovered = await resync(partial.shape);
        expect(feesOf(recovered.shape, "offer")).toEqual([]);
        expect(feeOf(recovered.shape, "offer")).toEqual(BigNumber(10));
      });

      it("keeps the fees of an offer not read in full through a rebuild", async () => {
        const pending = await syncPending();
        mockedGetPendingTransferProposals.mockResolvedValue([]);

        rows = [laterRow];
        const rebuilt = await syncAfter(pending, undefined);
        expect(rebuilt.from).toEqual([0]);
        expect(feesOf(rebuilt.shape, "offer")).toEqual([
          expect.objectContaining({ value: BigNumber(10) }),
        ]);
        expect(replayOf(rebuilt.shape)).toEqual([{ hash: "offer", height: 5 }]);
      });

      it("charges an offer read again under another offer's earlier read once", async () => {
        rows = [...offerRows("held", 3), ...offerRows("offer", 5)];
        mockedGetPendingTransferProposals.mockResolvedValue([
          sentOffer("held"),
          sentOffer("offer"),
        ]);
        const pending = await syncFrom({ syncHash: SYNC_HASH, cantonResources: {} as never });
        expect(replayOf(pending)).toEqual([
          { hash: "held", height: 3 },
          { hash: "offer", height: 5 },
        ]);

        mockedGetPendingTransferProposals.mockResolvedValue([sentOffer("held")]);
        rows = offerRows("held", 3);
        const skipped = await resync(pending);
        expect(skipped.from).toEqual([2]);

        rows = [...offerRows("held", 3), ...offerRows("offer", 5)];
        const recovered = await resync(skipped.shape);
        expect(recovered.from).toEqual([2]);
        expect(feesOf(recovered.shape, "offer")).toEqual([]);
        expect(feeOf(recovered.shape, "offer")).toEqual(BigNumber(10));
        expect(replayOf(recovered.shape)).toEqual([{ hash: "held", height: 3 }]);
      });

      describe("an offer stored in full before it was listed as pending", () => {
        const typesOf = (shape: Partial<CantonAccount>, hash: string) =>
          (shape.operations ?? [])
            .filter(op => op.hash === hash)
            .map(op => op.type)
            .sort();

        /** A sync where only "held" is pending yet, which stores "offer" in full. */
        const syncListedLate = async () => {
          rows = [...offerRows("held", 3), ...offerRows("offer", 5)];
          mockedGetPendingTransferProposals.mockResolvedValue([sentOffer("held")]);
          const listedLate = await syncFrom({ syncHash: SYNC_HASH, cantonResources: {} as never });
          expect(typesOf(listedLate, "offer")).toEqual(["OUT", "TRANSFER_PROPOSAL"]);
          expect(feeOf(listedLate, "offer")).toEqual(BigNumber(10));
          expect(replayOf(listedLate)).toEqual([{ hash: "held", height: 3 }]);
          mockedGetPendingTransferProposals.mockResolvedValue([
            sentOffer("held"),
            sentOffer("offer"),
          ]);
          return listedLate;
        };

        it("replaces its operations when read again while pending, charging its fees once", async () => {
          const listedLate = await syncListedLate();

          const pending = await resync(listedLate);
          expect(pending.from).toEqual([2]);
          expect(typesOf(pending.shape, "offer")).toEqual(["FEES"]);
          expect(feeOf(pending.shape, "offer")).toEqual(BigNumber(10));
          expect(replayOf(pending.shape)).toEqual(
            expect.arrayContaining([
              { hash: "held", height: 3 },
              { hash: "offer", height: 5 },
            ]),
          );
          expect(replayOf(pending.shape)).toHaveLength(2);

          mockedGetPendingTransferProposals.mockResolvedValue([sentOffer("held")]);
          const settled = await resync(pending.shape);
          expect(typesOf(settled.shape, "offer")).toEqual(["OUT", "TRANSFER_PROPOSAL"]);
          expect(feeOf(settled.shape, "offer")).toEqual(BigNumber(10));
          expect(replayOf(settled.shape)).toEqual([{ hash: "held", height: 3 }]);
        });

        it("keeps its operations when read again in part, until it is read in full", async () => {
          const listedLate = await syncListedLate();

          rows = [...offerRows("held", 3), offerRows("offer", 5)[0]];
          const partial = await resync(listedLate);
          expect(typesOf(partial.shape, "offer")).toEqual(["OUT", "TRANSFER_PROPOSAL"]);
          expect(feeOf(partial.shape, "offer")).toEqual(BigNumber(10));
          expect(replayOf(partial.shape)).toContainEqual({ hash: "offer", height: 5 });

          rows = offerRows("held", 3);
          const rebuilt = await syncAfter(partial.shape, undefined);
          expect(rebuilt.from).toEqual([0]);
          expect(typesOf(rebuilt.shape, "offer")).toEqual(["OUT", "TRANSFER_PROPOSAL"]);
          expect(feeOf(rebuilt.shape, "offer")).toEqual(BigNumber(10));
          expect(replayOf(rebuilt.shape)).toContainEqual({ hash: "offer", height: 5 });

          mockedGetPendingTransferProposals.mockResolvedValue([sentOffer("held")]);
          rows = [...offerRows("held", 3), ...offerRows("offer", 5)];
          const recovered = await resync(rebuilt.shape);
          expect(typesOf(recovered.shape, "offer")).toEqual(["OUT", "TRANSFER_PROPOSAL"]);
          expect(feeOf(recovered.shape, "offer")).toEqual(BigNumber(10));
          expect(replayOf(recovered.shape)).toEqual([{ hash: "held", height: 3 }]);
        });

        it("drops it on a rebuild from an older sync hash, its fee in another asset", async () => {
          const stored = {
            ...storedOperation(5),
            id: "offer-token",
            hash: "offer",
            fee: BigNumber(10),
            extra: { instrumentId: "Token", instrumentAdmin: "token-admin" },
          };

          const rebuilt = await syncAfter({ operations: [stored] }, undefined);
          expect(rebuilt.from).toEqual([0]);
          expect(typesOf(rebuilt.shape, "offer")).toEqual(["FEES"]);
          expect(feeOf(rebuilt.shape, "offer")).toEqual(BigNumber(10));
          expect(replayOf(rebuilt.shape)).toEqual([{ hash: "offer", height: 5 }]);

          mockedGetPendingTransferProposals.mockResolvedValue([]);
          const settled = await resync(rebuilt.shape);
          expect(typesOf(settled.shape, "offer")).toEqual(["OUT", "TRANSFER_PROPOSAL"]);
          expect(feeOf(settled.shape, "offer")).toEqual(BigNumber(10));
          expect(replayOf(settled.shape)).toEqual([]);
        });
      });

      describe("a received offer", () => {
        const offer = { ...sentOffer("received"), sender: "alice", receiver: "party123" };
        const offerRow: OperationInfo = {
          ...at(
            createMockOperationView({ txHash: "received", operationType: "transfer-proposal" }),
            5,
          ),
          type: "Receive",
          senders: ["alice"],
        };
        const replay = [{ hash: "received", height: 5 }];

        beforeEach(() => {
          rows = [offerRow, laterRow];
          mockedGetPendingTransferProposals.mockResolvedValue([offer]);
        });

        it("is read again until it settles, also after a read that leaves it out", async () => {
          const pending = await syncFirst();
          expect(hashesOf(pending)).toEqual(["later", "earlier"]);
          expect(replayOf(pending)).toEqual(replay);
          expect(checkpointOf(pending)).toEqual(belowOffers);

          mockedGetPendingTransferProposals.mockResolvedValue([]);
          rows = [laterRow];
          const leftOut = await resync(pending);
          expect(leftOut.from).toEqual([2]);
          expect(hashesOf(leftOut.shape)).toEqual(["later", "earlier"]);
          expect(replayOf(leftOut.shape)).toEqual(replay);
          expect(checkpointOf(leftOut.shape)).toEqual(belowOffers);

          rows = [offerRow, laterRow];
          const settled = await resync(leftOut.shape);
          expect(settled.from).toEqual([2]);
          expect(hashesOf(settled.shape)).toEqual(["later", "received", "earlier"]);
          expect(settled.shape.operations?.[1].type).toBe("TRANSFER_PROPOSAL");
          expect(replayOf(settled.shape)).toEqual([]);
          expect(checkpointOf(settled.shape)).toEqual({ hash: "later", height: 9 });
        });

        it("leaves no checkpoint while it is the first row, and is read from offset 0", async () => {
          serveRows(() => rows);
          const pending = await syncFirst();
          expect(checkpointOf(pending)).toBeUndefined();

          mockedGetPendingTransferProposals.mockResolvedValue([]);
          const settled = await resync(pending);
          expect(settled.from).toEqual([0]);
          expect(hashesOf(settled.shape)).toEqual(["later", "received"]);
          expect(checkpointOf(settled.shape)).toEqual({ hash: "later", height: 9 });
        });

        it("is found again on a node whose offsets differ, after a full read that leaves it out", async () => {
          const pending = await syncFirst();

          mockedGetPendingTransferProposals.mockResolvedValue([]);
          const otherNodeRows = [at(earlierRow, 1), at(offerRow, 3), at(laterRow, 40)];
          serveRows(() => [otherNodeRows[0], otherNodeRows[2]]);
          const leftOut = await resync(pending);
          expect(replayOf(leftOut.shape)).toEqual(replay);
          expect(checkpointOf(leftOut.shape)).toBeUndefined();

          serveRows(() => otherNodeRows);
          const settled = await resync(leftOut.shape);
          expect(settled.from).toEqual([0]);
          expect(hashesOf(settled.shape)).toContain("received");
          expect(replayOf(settled.shape)).toEqual([]);
        });

        it("replaces an operation of another type stored before it was listed as pending", async () => {
          rows = [at(createMockOperationView({ txHash: "received", type: "Receive" }), 5)];
          rows[0].senders = ["alice"];
          mockedGetPendingTransferProposals.mockResolvedValue([]);
          const degraded = await syncFirst();
          expect(degraded.operations?.map(({ type }) => type)).toEqual(["IN", "OUT"]);

          rows = [offerRow, laterRow];
          mockedGetPendingTransferProposals.mockResolvedValue([offer]);
          const pending = await resync(degraded);
          expect(replayOf(pending.shape)).toEqual(replay);
          expect(checkpointOf(pending.shape)).toBeUndefined();

          mockedGetPendingTransferProposals.mockResolvedValue([]);
          const settled = await resync(pending.shape);
          expect(settled.from).toEqual([0]);
          expect(settled.shape.operations?.map(({ type }) => type)).toEqual([
            "OUT",
            "TRANSFER_PROPOSAL",
            "OUT",
          ]);
          expect(checkpointOf(settled.shape)).toEqual({ hash: "later", height: 9 });
        });

        it("is not replayed when it was stored before it was listed as pending", async () => {
          rows = [offerRow];
          mockedGetPendingTransferProposals.mockResolvedValue([]);
          const listedLate = await syncFirst();
          expect(hashesOf(listedLate)).toEqual(["received", "earlier"]);

          mockedGetPendingTransferProposals.mockResolvedValue([offer]);
          const next = await resync(listedLate);
          expect(next.from).toEqual([5]);
          expect(hashesOf(next.shape)).toEqual(["received", "earlier"]);
          expect(replayOf(next.shape)).toEqual([]);
        });

        describe("whose row comes back without transfers", () => {
          const invalidRow = { ...offerRow, transfers: [] };

          beforeEach(() => {
            rows = [invalidRow, laterRow];
          });

          it("keeps the checkpoint below it while pending, and is recorded once it settles", async () => {
            const pending = await syncFirst();
            expect(hashesOf(pending)).toEqual(["later", "earlier"]);
            expect(replayOf(pending)).toEqual([]);
            expect(checkpointOf(pending)).toEqual(belowOffers);

            const stillPending = await resync(pending);
            expect(stillPending.from).toEqual([2]);
            expect(checkpointOf(stillPending.shape)).toEqual(belowOffers);

            mockedGetPendingTransferProposals.mockResolvedValue([]);
            rows = [offerRow, laterRow];
            const settled = await resync(stillPending.shape);
            expect(settled.from).toEqual([2]);
            expect(hashesOf(settled.shape)).toEqual(["later", "received", "earlier"]);
            expect(checkpointOf(settled.shape)).toEqual({ hash: "later", height: 9 });
          });

          it("is replayed once its row is valid while pending", async () => {
            const pending = await syncFirst();

            rows = [offerRow, laterRow];
            const valid = await resync(pending);
            expect(replayOf(valid.shape)).toEqual(replay);
            expect(checkpointOf(valid.shape)).toEqual(belowOffers);
          });

          it.each([
            ["", []],
            [", also next to a valid row", [offerRow]],
          ])("no longer holds the checkpoint once it settles%s", async (_, validRows) => {
            rows = [invalidRow, ...validRows, laterRow];
            const pending = await syncFirst();
            expect(replayOf(pending)).toEqual([]);
            expect(checkpointOf(pending)).toEqual(belowOffers);

            mockedGetPendingTransferProposals.mockResolvedValue([]);
            const settled = await resync(pending);
            expect(replayOf(settled.shape)).toEqual([]);
            expect(checkpointOf(settled.shape)).toEqual({ hash: "later", height: 9 });
          });

          it("does not hold the checkpoint when it was stored before it was listed as pending", async () => {
            rows = [offerRow];
            mockedGetPendingTransferProposals.mockResolvedValue([]);
            const listedLate = await syncFirst();

            mockedGetPendingTransferProposals.mockResolvedValue([offer]);
            rows = [invalidRow, laterRow];
            const next = await resync(listedLate);
            expect(hashesOf(next.shape)).toEqual(["later", "received", "earlier"]);
            expect(checkpointOf(next.shape)).toEqual({ hash: "later", height: 9 });
          });
        });
      });

      it("does not read again an offer listed late, below the checkpoint", async () => {
        rows = [...offerRows("offer", 5), laterRow];
        mockedGetPendingTransferProposals.mockResolvedValue([]);
        const listedLate = await syncFrom({ syncHash: SYNC_HASH, cantonResources: {} as never });

        mockedGetPendingTransferProposals.mockResolvedValue([sentOffer("offer")]);
        const next = await resync(listedLate);
        expect(next.from).toEqual([9]);
        expect(feeOf(next.shape, "offer")).toEqual(BigNumber(10));
        expect(replayOf(next.shape)).toEqual([]);
      });
    });

    it("rebuilds the history from offset 0 when the sync hash changed", async () => {
      const balanceHistoryCache = { HOUR: { latestDate: 1, balances: [] } };
      mockedGetOperations.mockResolvedValue({
        operations: [createMockOperationView({ txHash: "fresh" })],
        next: -1,
      });

      const shape = await syncFrom({
        syncHash: undefined,
        operations: [storedOperation(5, 999)],
        subAccounts: [
          { id: "sub", operations: [storedOperation(9)], balanceHistoryCache },
        ] as unknown as TokenAccount[],
      });

      expect(readFrom()).toEqual([{ minOffset: 0, maxOffset: 12345, limit: 1000 }]);
      expect(shape.operations?.map(op => op.hash)).toEqual(["fresh"]);
    });

    describe("through the account bridge", () => {
      beforeEach(() => {
        mockedGetOperations.mockResolvedValue({
          operations: [createMockOperationView({ txHash: "fresh" })],
          next: -1,
        });
      });

      it("drops the stale stored operations after a sync hash change", async () => {
        const account = await syncAccount(undefined);

        expect(account.operations.map(op => op.hash)).toEqual(["fresh"]);
        expect(account.syncHash).toBe(SYNC_HASH);
      });

      it("keeps the stored operations on an incremental sync", async () => {
        const account = await syncAccount(SYNC_HASH);

        expect(account.operations.map(op => op.hash)).toEqual(["fresh", "stored-5"]);
      });

      it("removes a pending operation once its transaction is synced, keeping the others", async () => {
        const account = await syncAccount(SYNC_HASH, {
          pendingOperations: [
            pendingOperation("later", Date.now() + 1),
            pendingOperation("fresh", Date.now()),
          ],
        });

        expect(account.pendingOperations.map(op => op.hash)).toEqual(["later"]);
      });
    });
  });

  describe("native instrument admin", () => {
    it("counts only the DSO's holdings of the native instrument id as CC", async () => {
      mockedGetBalance.mockResolvedValue([
        impostorAmulet("900"),
        createMockNativeBalance("1000"),
        createMockNativeBalance("50", true),
      ]);

      const shape = await sync();

      expect(shape).toMatchObject({
        balance: BigNumber(1050),
        spendableBalance: BigNumber(1000),
        subAccounts: [],
      });
      expect(shape.cantonResources?.instrumentUtxoCounts).toEqual({
        Amulet: 1,
        "Amulet____impostor::1220dddd": 1,
      });
    });

    it("keeps the DSO party on the account for the offer list", async () => {
      mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);

      const shape = await sync();

      expect(shape.cantonResources?.nativeInstrumentAdmin).toBe("native-admin");
    });

    it("scans an account without a party without reading the DSO party", async () => {
      mockedIsOnboarded.mockResolvedValue({ isOnboarded: false });

      const shape = await sync();

      expect(mockedGetNativeInstrument).not.toHaveBeenCalled();
      expect(shape.cantonResources).not.toHaveProperty("nativeInstrumentAdmin");
    });

    it("fails rather than guess the CC balance when the DSO party can't be read or was never saved", async () => {
      mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
      mockedGetNativeInstrument.mockRejectedValue(new Error("gateway down"));

      await expect(sync()).rejects.toThrow("gateway down");
    });

    it("uses the DSO party saved by an earlier sync when it can't be read", async () => {
      mockedGetBalance.mockResolvedValue([impostorAmulet("900"), createMockNativeBalance("1000")]);
      mockedGetNativeInstrument.mockRejectedValue(new Error("gateway down"));
      const info = createMockCantonAccountShapeInfo({
        initialAccount: {
          xpub: "party123",
          cantonResources: {
            isOnboarded: true,
            instrumentUtxoCounts: {},
            pendingTransferProposals: [],
            nativeInstrumentAdmin: "native-admin",
          },
        } as unknown as CantonAccount,
      });

      const shape = await makeGetAccountShape(fakeSignerContext, fakeContext)(info, {
        paginationConfig: {},
      });

      expect(mockedGetBalance).toHaveBeenCalledWith(expect.anything(), "party123", {
        instrumentId: "Amulet",
        instrumentAdmin: "native-admin",
      });
      expect(shape.balance).toEqual(BigNumber(1000));
      expect(shape.cantonResources?.nativeInstrumentAdmin).toBe("native-admin");
    });
  });
});

const createMockTokenAccount = (contractAddress: string, tokenId?: string): TokenAccount => ({
  type: "TokenAccount",
  id: `token-account-${contractAddress}`,
  parentId: "parent-account-id",
  token: {
    type: "TokenCurrency",
    id: tokenId ?? `token-id-${contractAddress}`,
    contractAddress,
    name: "Test Token",
    ticker: "TEST",
    decimals: 18,
    parentCurrencyId: "canton_network",
  } as any,
  balance: new BigNumber(100),
  spendableBalance: new BigNumber(100),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
  creationDate: new Date(),
});

describe("filterDisabledTokenAccounts", () => {
  it("keeps the token accounts of enabled CAL tokens only", () => {
    const enabled = createMockTokenAccount("0xenabled", "token-id-enabled");
    const disabled = createMockTokenAccount("0xdisabled", "token-id-disabled");
    const unlisted = createMockTokenAccount("0xunlisted", "token-id-unlisted");
    const calTokens = new Map([
      ["token-id-enabled", "instrument-enabled"],
      ["token-id-disabled", "instrument-disabled"],
    ]);

    const result = filterDisabledTokenAccounts(
      [enabled, disabled, unlisted],
      calTokens,
      new Set(["instrument-enabled____0xenabled", "instrument-unlisted____0xunlisted"]),
    );

    expect(result).toEqual([enabled]);
  });

  it("does not keep token accounts without contractAddress", () => {
    const withoutAddress = createMockTokenAccount("", "token-id-noaddr");

    const result = filterDisabledTokenAccounts(
      [withoutAddress],
      new Map([["token-id-noaddr", "instrument-noaddr"]]),
      new Set(["instrument-noaddr____"]),
    );

    expect(result).toEqual([]);
  });

  it("keeps nothing when no instrument is enabled", () => {
    const result = filterDisabledTokenAccounts(
      [createMockTokenAccount("0xtoken1", "token-id-1")],
      new Map([["token-id-1", "instrument-1"]]),
      new Set(),
    );

    expect(result).toEqual([]);
  });
});
