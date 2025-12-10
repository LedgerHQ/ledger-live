import { makeGetAccountShape } from "./sync";
import { OperationInfo } from "../network/gateway";
import * as gateway from "../network/gateway";
import * as onboard from "./onboard";
import * as config from "../config";
import * as accountBalance from "../common-logic/account/getBalance";
import resolver from "../signer";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CantonAccount } from "../types";
import { createMockCantonCurrency } from "../test/fixtures";

jest.mock("../network/gateway");
jest.mock("../signer");
jest.mock("../config");
jest.mock("./onboard");
jest.mock("../common-logic/account/getBalance");
jest.mock("@ledgerhq/cryptoassets/state", () => {
  const store = {
    findTokenByAddressInCurrency: jest.fn().mockResolvedValue(undefined),
  };
  return {
    getCryptoAssetsStore: jest.fn(() => store),
  };
});

const mockedGetBalance = accountBalance.getBalance as jest.Mock;
const mockedGetLedgerEnd = gateway.getLedgerEnd as jest.Mock;
const mockedGetOperations = gateway.getOperations as jest.Mock;
const mockedGetPendingTransferProposals = gateway.getPendingTransferProposals as jest.Mock;
const mockedGetCalTokensCached = gateway.getCalTokensCached as jest.Mock;
const mockedResolver = resolver as jest.Mock;
const mockedIsOnboarded = onboard.isAccountOnboarded as jest.Mock;
const mockedIsAuthorized = onboard.isCantonCoinPreapproved as jest.Mock;
const mockedCoinConfig = config.default.getCoinConfig as jest.Mock;

const sampleCurrency = createMockCantonCurrency();

type CantonBalance = {
  value: bigint;
  locked: bigint;
  asset: { type: "native" } | { type: "token"; assetReference: string };
  utxoCount: number;
  instrumentId: string;
  adminId: string;
};

const createMockNativeBalance = (amount: string, locked = false): CantonBalance => ({
  value: BigInt(amount),
  locked: locked ? BigInt(amount) : BigInt(0),
  asset: { type: "native" },
  utxoCount: 1,
  instrumentId: "Amulet",
  adminId: "native-admin",
});

const createMockTokenBalance = (
  instrumentId: string,
  amount: string,
  locked = false,
): CantonBalance => ({
  value: BigInt(amount),
  locked: locked ? BigInt(amount) : BigInt(0),
  asset: { type: "token", assetReference: instrumentId },
  utxoCount: 1,
  instrumentId,
  adminId: `admin-${instrumentId}`,
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
        type: "native",
        issuer: null,
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
      instrumentId: overrides.instrumentId ?? "Amulet",
      instrumentAdmin: overrides.instrumentAdmin ?? null,
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

describe("makeGetAccountShape", () => {
  const fakeSignerContext = {} as any;

  const defaultInfo = {
    address: "addr1",
    currency: sampleCurrency,
    derivationMode: "",
    derivationPath: "44'/0'/0'/0/0",
    deviceId: "fakeDevice",
    initialAccount: undefined,
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

    mockedCoinConfig.mockReturnValue({
      nativeInstrumentId: "Amulet",
      minReserve: "0",
      useGateway: true,
    });

    mockedIsAuthorized.mockResolvedValue(true);
    mockedGetLedgerEnd.mockResolvedValue(12345);
    mockedGetPendingTransferProposals.mockResolvedValue([]);
    mockedGetCalTokensCached.mockResolvedValue(new Map());
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
    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
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

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });

    expect(shape).toBeDefined();
    expect(shape.balance).toEqual(BigNumber(1010));
    expect(shape.spendableBalance).toEqual(BigNumber(10));
  });

  it("should handle empty balances correctly", async () => {
    mockedGetBalance.mockResolvedValue([]);

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });

    expect(shape).toBeDefined();
    expect(shape.balance).toEqual(BigNumber(0));
    expect(shape.spendableBalance).toEqual(BigNumber(0));
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

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("FEES");
    // In this case, value should equal the fee
    expect(shape.operations[0].value).toEqual(BigNumber(5)); // fee is 5 in createMockOperationView
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

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("TRANSFER_PROPOSAL");
    expect(shape.operations[0].value).toEqual(BigNumber(200)); // transfer value only, fees not added for TRANSFER_PROPOSAL
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

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("TRANSFER_REJECTED");
    expect(shape.operations[0].value).toEqual(BigNumber(150)); // transfer value only, fees not added for TRANSFER_REJECTED
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

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("TRANSFER_WITHDRAWN");
    expect(shape.operations[0].value).toEqual(BigNumber(50)); // transfer value only, fees not added for TRANSFER_WITHDRAWN
  });

  it("should sync without device when account has xpub but no publicKey", async () => {
    mockedGetBalance.mockResolvedValue([createMockNativeBalance("1000")]);
    mockedGetOperations.mockResolvedValue({
      operations: [createMockOperationView()],
    });

    const infoWithXpub = createMockCantonAccountShapeInfo({
      deviceId: undefined, // No device
      initialAccount: {
        xpub: "test-party-id",
        cantonResources: {
          publicKey: undefined, // Missing publicKey
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      } as unknown as CantonAccount,
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(infoWithXpub, { paginationConfig: {} });

    expect(shape).toHaveProperty("id");
    expect(shape.xpub).toBe("test-party-id");
    // Should not call getAddress since we have xpub
    expect(mockedResolver).not.toHaveBeenCalled();
  });

  it("should sync without device when account has publicKey but no xpub", async () => {
    mockedGetBalance.mockResolvedValue([]); // Empty balances since no xpub
    mockedGetOperations.mockResolvedValue({
      operations: [],
    });

    const infoWithPublicKey = createMockCantonAccountShapeInfo({
      deviceId: undefined, // No device
      initialAccount: {
        xpub: "", // Missing xpub
        cantonResources: {
          publicKey: "test-public-key",
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      } as unknown as CantonAccount,
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
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
      deviceId: undefined, // No device
      initialAccount: {
        xpub: "test-party-id",
        cantonResources: {
          publicKey: "test-public-key",
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      } as unknown as CantonAccount,
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(infoWithBoth, { paginationConfig: {} });

    expect(shape).toHaveProperty("id");
    expect(shape.xpub).toBe("test-party-id");
    // Should not call getAddress since we have both values
    expect(mockedResolver).not.toHaveBeenCalled();
  });
});
