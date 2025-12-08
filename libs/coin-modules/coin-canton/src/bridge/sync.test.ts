/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";
import * as config from "../config";
import * as gateway from "../network/gateway";
import resolver from "../signer";
import {
  createFactory,
  createMockCantonCurrency,
  createMockInstrumentBalances,
  createMockSignerContext,
} from "../test/fixtures";
import type { CantonAccount } from "../types";
import type {
  OperationStatusView,
  OperationTypeView,
  OperationView,
  TransferView,
} from "../types/gateway";
import * as onboard from "./onboard";
import { makeGetAccountShape } from "./sync";

jest.mock("../config");
jest.mock("../network/gateway");
jest.mock("../signer");
jest.mock("./onboard");

const mockedCoinConfig = config.default.getCoinConfig as jest.Mock;
const mockedGetBalance = gateway.getBalance as jest.Mock;
const mockedGetLedgerEnd = gateway.getLedgerEnd as jest.Mock;
const mockedGetOperations = gateway.getOperations as jest.Mock;
const mockedIsAuthorized = onboard.isCantonCoinPreapproved as jest.Mock;
const mockedIsOnboarded = onboard.isAccountOnboarded as jest.Mock;
const mockedResolver = resolver as jest.Mock;

const instrumentAdmin = "AmuletAdmin";
const instrumentId = "Amulet";

let idCounter = 0;
const generateUniqueId = (prefix: string): string => `${prefix}${++idCounter}`;

const createMockCantonAccountShapeInfo = (
  overrides: Partial<AccountShapeInfo<CantonAccount>> = {},
): AccountShapeInfo<CantonAccount> => {
  const currency = createMockCantonCurrency();
  return {
    address: "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000",
    currency,
    derivationMode: "canton",
    derivationPath: "44'/6767'/0'/0'/0'",
    deviceId: "test-device-id",
    initialAccount: undefined,
    ...overrides,
  } as AccountShapeInfo<CantonAccount>;
};

const createMockOperationView = (overrides: Partial<OperationView> = {}): OperationView => {
  const transactionHash = overrides.transaction_hash || generateUniqueId("tx");
  return {
    uid: generateUniqueId("uid"),
    transaction_hash: transactionHash,
    transaction_timestamp: new Date().toISOString(),
    status: "Success" as OperationStatusView,
    type: "Send" as OperationTypeView,
    senders: ["test-party-id-1"],
    recipients: ["test-party-id-2"],
    transfers: [createMockTransferView()],
    block: {
      height: 1,
      time: new Date().toISOString(),
      hash: "blockhash1",
    },
    fee: {
      value: "5",
      asset: {
        type: "native",
        instrumentAdmin,
        instrumentId,
      },
      details: {},
    },
    details: {
      metadata: {
        reason: "test transfer",
      },
    },
    ...overrides,
  };
};

const createMockTransferView = createFactory<TransferView>({
  address: "party456",
  type: "Send",
  value: "100",
  details: {
    metadata: {
      reason: "test transfer",
    },
  },
  asset: instrumentId,
});

describe("makeGetAccountShape", () => {
  const mockSignerContext = createMockSignerContext();
  const defaultInfo = createMockCantonAccountShapeInfo();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedCoinConfig.mockReturnValue({
      nativeInstrumentId: "Amulet",
      minReserve: "0",
      useGateway: true,
    });
    mockedGetLedgerEnd.mockResolvedValue(12345);
    mockedIsAuthorized.mockResolvedValue(true);
    mockedIsOnboarded.mockResolvedValue({ isOnboarded: true, partyId: "test-party-id" });
    mockedResolver.mockReturnValue(async () => ({ publicKey: "test-public-key" }));
  });

  it("should return a valid account shape with correct balances and operations", async () => {
    mockedGetBalance.mockResolvedValue(createMockInstrumentBalances());
    mockedGetOperations.mockResolvedValue({
      operations: [createMockOperationView()],
    });
    const getAccountShape = makeGetAccountShape(mockSignerContext);
    const shape = await getAccountShape(defaultInfo, { paginationConfig: {} });

    expect(shape).toHaveProperty("id");
    expect(shape.balance).toEqual(BigNumber(1000));
    expect(shape.operations?.length).toBe(1);
    expect(shape.operations![0].type).toBe("IN");
    expect(shape.operations![0].value).toEqual(BigNumber(100));
    expect(shape.spendableBalance).toEqual(BigNumber(1000));
    expect(shape.used).toBe(true);
  });

  it("should handle locked balances correctly", async () => {
    mockedGetBalance.mockResolvedValue(
      createMockInstrumentBalances(2, [{ amount: "1000", locked: true }, { amount: "10" }]),
    );

    const getAccountShape = makeGetAccountShape(mockSignerContext);
    const shape = await getAccountShape(defaultInfo, { paginationConfig: {} });

    expect(shape).toBeDefined();
    expect(shape.balance).toEqual(BigNumber(1010));
    expect(shape.spendableBalance).toEqual(BigNumber(1010));
  });

  it("should handle empty balances correctly", async () => {
    mockedGetBalance.mockResolvedValue([]);

    const getAccountShape = makeGetAccountShape(mockSignerContext);
    const shape = await getAccountShape(defaultInfo, { paginationConfig: {} });

    expect(shape).toBeDefined();
    expect(shape.balance).toEqual(BigNumber(0));
    expect(shape.spendableBalance).toEqual(BigNumber(0));
  });

  it("should default to FEES operation type when transferValue is 0", async () => {
    mockedGetBalance.mockResolvedValue(createMockInstrumentBalances());
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          transfers: [
            createMockTransferView({
              value: "0",
              details: {
                metadata: {
                  reason: "fee only",
                },
              },
            }),
          ],
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(mockSignerContext);
    const shape = await getAccountShape(defaultInfo, { paginationConfig: {} });
    expect(shape).toBeDefined();
    expect(shape.operations).toBeDefined();
    expect(shape.operations?.length).toBeGreaterThan(0);
    expect(shape.operations![0].type).toBe("FEES");
    // In this case, value should equal the fee
    expect(shape.operations![0].value).toEqual(BigNumber(5));
  });

  it("should set operation type to TRANSFER_PROPOSAL when operationType is transfer-proposal", async () => {
    mockedGetBalance.mockResolvedValue(createMockInstrumentBalances());
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          transfers: [
            createMockTransferView({
              value: "200",
              details: {
                operationType: "transfer-proposal",
                metadata: {
                  reason: "transfer proposal",
                },
              },
            }),
          ],
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(mockSignerContext);
    const shape = await getAccountShape(defaultInfo, { paginationConfig: {} });
    expect(shape).toBeDefined();
    expect(shape.operations).toBeDefined();
    expect(shape.operations?.length).toBeGreaterThan(0);
    expect(shape.operations![0].type).toBe("TRANSFER_PROPOSAL");
    expect(shape.operations![0].value).toEqual(BigNumber(200)); // transfer value only, fees not added for TRANSFER_PROPOSAL
  });

  it("should set operation type to TRANSFER_REJECTED when operationType is transfer-rejected", async () => {
    mockedGetBalance.mockResolvedValue(createMockInstrumentBalances());
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          transfers: [
            createMockTransferView({
              value: "150",
              details: {
                operationType: "transfer-rejected",
                metadata: {
                  reason: "transfer rejected",
                },
              },
            }),
          ],
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(mockSignerContext);
    const shape = await getAccountShape(defaultInfo, { paginationConfig: {} });
    expect(shape).toBeDefined();
    expect(shape.operations).toBeDefined();
    expect(shape.operations?.length).toBeGreaterThan(0);
    expect(shape.operations![0].type).toBe("TRANSFER_REJECTED");
    expect(shape.operations![0].value).toEqual(BigNumber(150)); // transfer value only, fees not added for TRANSFER_REJECTED
  });

  it("should set operation type to TRANSFER_WITHDRAWN when operationType is transfer-withdrawn", async () => {
    mockedGetBalance.mockResolvedValue(createMockInstrumentBalances());
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          transfers: [
            createMockTransferView({
              value: "50",
              details: {
                operationType: "transfer-withdrawn",
                metadata: {
                  reason: "transfer withdrawn",
                },
              },
            }),
          ],
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(mockSignerContext);
    const shape = await getAccountShape(defaultInfo, { paginationConfig: {} });
    expect(shape).toBeDefined();
    expect(shape.operations).toBeDefined();
    expect(shape.operations?.length).toBeGreaterThan(0);
    expect(shape.operations![0].type).toBe("TRANSFER_WITHDRAWN");
    expect(shape.operations![0].value).toEqual(BigNumber(50)); // transfer value only, fees not added for TRANSFER_WITHDRAWN
  });

  it("should sync without device when account has xpub but no publicKey", async () => {
    mockedGetBalance.mockResolvedValue(createMockInstrumentBalances());
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

    const getAccountShape = makeGetAccountShape(mockSignerContext);
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

    const getAccountShape = makeGetAccountShape(mockSignerContext);
    const shape = await getAccountShape(infoWithPublicKey, { paginationConfig: {} });

    expect(shape).toHaveProperty("id");
    // Should not call getAddress since we have publicKey (even though xpub is missing)
    expect(mockedResolver).not.toHaveBeenCalled();
  });

  it("should sync without device when account has both xpub and publicKey", async () => {
    mockedGetBalance.mockResolvedValue(createMockInstrumentBalances());
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

    const getAccountShape = makeGetAccountShape(mockSignerContext);
    const shape = await getAccountShape(infoWithBoth, { paginationConfig: {} });

    expect(shape).toHaveProperty("id");
    expect(shape.xpub).toBe("test-party-id");
    // Should not call getAddress since we have both values
    expect(mockedResolver).not.toHaveBeenCalled();
  });
});
