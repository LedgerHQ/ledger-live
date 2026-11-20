import {
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Account, AccountRaw, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CantonContext } from "../config";
import * as instrumentBalances from "./instrumentBalances";
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
jest.mock("./instrumentBalances");
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
  instrumentId: string;
  adminId: string;
};

const createMockNativeBalance = (amount: string, locked = false): CantonBalance => ({
  value: BigInt(amount),
  locked: locked ? BigInt(amount) : BigInt(0),
  asset: { type: "Amulet" },
  utxoCount: 1,
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

const readFrom = () => mockedGetOperations.mock.calls.map(([, , options]) => options);

const syncFrom = (initialAccount: Partial<CantonAccount>) =>
  makeGetAccountShape({} as SignerContext<CantonSigner>, fakeContext)(
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
        { ...tokenBalance(calAdmin, "200"), locked: 200n },
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
        [`${instrumentId}____${calAdmin}`]: 2,
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
        const pendingOperations = [{ id: "pending" }];
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
        expect(subAccount.pendingOperations).toBe(pendingOperations);
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
          });

          expect(readFrom()).toEqual([expect.objectContaining({ minOffset: 0 })]);
          expect(account.operations.map(op => op.hash).sort()).toEqual(["early-token", "late"]);
          expect(fees(account)).toEqual([
            expect.objectContaining({ hash: "early-token", value: BigNumber(5) }),
          ]);
          expect(account.subAccounts?.[0].operations.map(op => op.hash)).toEqual(["early-token"]);
        });

        it("reads on from the newest stored operation once the sub-account is stored", async () => {
          await syncAccount(SYNC_HASH, {
            id: accountId,
            operations: [storedOperation(20)],
            subAccounts: [storedUsdcx],
          });

          expect(readFrom()).toEqual([expect.objectContaining({ minOffset: 21 })]);
        });

        it("does not read the history again for a held token that stays disabled", async () => {
          mockedGetEnabledInstrumentsCached.mockResolvedValue(new Set());

          await syncAccount(SYNC_HASH, { id: accountId, operations: [storedOperation(20)] });
          await syncAccount(SYNC_HASH, { id: accountId, operations: [storedOperation(20)] });

          expect(readFrom()).toEqual([
            expect.objectContaining({ minOffset: 21 }),
            expect.objectContaining({ minOffset: 21 }),
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

    it("reads past the newest stored operation of any account, up to the ledger end", async () => {
      const shape = await syncFrom({
        syncHash: SYNC_HASH,
        operations: [storedOperation(5)],
        subAccounts: [{ operations: [storedOperation(9)] }] as unknown as TokenAccount[],
      });

      expect(readFrom()).toEqual([{ minOffset: 10, maxOffset: 12345, limit: 1000 }]);
      expect(shape.operations).toEqual([storedOperation(5)]);
      expect(shape.syncHash).toBe(SYNC_HASH);
    });

    it("reads nothing when the account is at the ledger end", async () => {
      await syncFrom({ syncHash: SYNC_HASH, operations: [storedOperation(12345)] });

      expect(mockedGetOperations).not.toHaveBeenCalled();
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
      const laterRow = at(createMockOperationView({ txHash: "later" }), 9);
      let rows: OperationInfo[] = [];

      beforeEach(() => {
        rows = offerRows("offer", 5);
        mockedGetOperations.mockImplementation(async (_config, _party, { minOffset }) => ({
          operations: rows.filter(row => row.block.height >= minOffset),
          next: -1,
        }));
        mockedGetPendingTransferProposals.mockResolvedValue([sentOffer("offer")]);
      });

      it("replaces the fees stored while pending once the offer settles, and reads on", async () => {
        const pending = await syncPending();

        mockedGetPendingTransferProposals.mockResolvedValue([]);
        rows = [...offerRows("offer", 5), laterRow];
        const settled = await resync(pending);
        expect(settled.from).toEqual([5]);
        expect(feesOf(settled.shape, "offer")).toEqual([]);
        expect(
          settled.shape.operations?.filter(op => op.hash === "offer").map(op => op.type),
        ).toEqual(expect.arrayContaining(["TRANSFER_PROPOSAL", "OUT"]));
        expect(feeOf(settled.shape, "offer")).toEqual(BigNumber(10));
        expect(replayOf(settled.shape)).toEqual([]);

        const next = await resync(settled.shape);
        expect(next.from).toEqual([10]);
      });

      it("keeps the fees of a settled offer the gateway does not read in full, until it does", async () => {
        const pending = await syncPending();
        mockedGetPendingTransferProposals.mockResolvedValue([]);
        const invalid = offerRows("offer", 5).map(row => ({ ...row, transfers: [] }));

        let previous: Partial<CantonAccount> = pending;
        for (const partial of [[], invalid, [offerRows("offer", 5)[0], invalid[1]]]) {
          rows = [...partial, laterRow];
          const { shape, from } = await resync(previous);
          expect(from).toEqual([5]);
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
        expect(skipped.from).toEqual([3]);

        rows = [...offerRows("held", 3), ...offerRows("offer", 5)];
        const recovered = await resync(skipped.shape);
        expect(recovered.from).toEqual([3]);
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
          expect(pending.from).toEqual([3]);
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

      it("does not replay a received offer stored before it was listed as pending", async () => {
        const offer = { ...sentOffer("received"), sender: "alice", receiver: "party123" };
        rows = [
          {
            ...at(
              createMockOperationView({ txHash: "received", operationType: "transfer-proposal" }),
              5,
            ),
            type: "Receive",
            senders: ["alice"],
          },
        ];
        mockedGetPendingTransferProposals.mockResolvedValue([]);
        const listedLate = await syncFrom({ syncHash: SYNC_HASH, cantonResources: {} as never });
        expect(listedLate.operations?.map(op => op.hash)).toEqual(["received"]);

        mockedGetPendingTransferProposals.mockResolvedValue([offer]);
        const next = await resync(listedLate);
        expect(next.from).toEqual([6]);
        expect(next.shape.operations?.map(op => op.hash)).toEqual(["received"]);
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
        Amulet: 2,
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
