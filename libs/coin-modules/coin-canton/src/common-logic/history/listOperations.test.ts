import coinConfig, { isGatewayEnabled } from "../../config";
import { getOperations } from "../../network/gateway";
import { createMockCantonCurrency, createMockCoinConfigValue } from "../../test/fixtures";
import type { OperationView } from "../../types/gateway";
import { listOperations } from "./listOperations";

jest.mock("../../network/gateway", () => ({ getOperations: jest.fn() }));
jest.mock("../../config", () => ({
  __esModule: true,
  isGatewayEnabled: jest.fn(() => true),
  default: {
    getCoinConfig: jest.fn(),
  },
}));

const mockCurrency = createMockCantonCurrency();
const mockedGetOperations = jest.mocked(getOperations);
const mockedGetCoinConfig = jest.mocked(coinConfig.getCoinConfig);
const mockedIsGatewayEnabled = jest.mocked(isGatewayEnabled);

const feeAssetNative = {
  type: "native" as const,
  instrumentAdmin: "admin",
  instrumentId: "Amulet",
};

function createMockOperationView(overrides: Partial<OperationView> = {}): OperationView {
  return {
    uid: "uid-1",
    transaction_hash: "0xtxhash",
    transaction_timestamp: "2024-01-01T00:00:00.000Z",
    status: "Success",
    type: "Send",
    senders: ["alice-party"],
    recipients: ["bob-party"],
    transfers: [
      {
        address: "addr",
        type: "Send",
        value: "100",
        details: {},
        asset: "asset-ref",
      },
    ],
    block: {
      height: 10,
      time: "2024-01-01T00:00:00.000Z",
      hash: "blockhash",
    },
    fee: {
      value: "1",
      asset: feeAssetNative,
      details: {},
    },
    asset: { type: "native", instrumentAdmin: "admin", instrumentId: "Amulet" },
    details: {},
    ...overrides,
  };
}

/** Omits optional fields (exactOptionalPropertyTypes forbids passing `undefined` in overrides). */
function mockOperationViewWithoutAsset(): OperationView {
  const { asset: _a, ...rest } = createMockOperationView();
  return rest;
}

function mockOperationViewWithoutTransfers(): OperationView {
  const { transfers: _t, ...rest } = createMockOperationView();
  return rest;
}

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsGatewayEnabled.mockReturnValue(true);
    mockedGetCoinConfig.mockReturnValue(createMockCoinConfigValue());
  });

  it("should throw when gateway is disabled in config", async () => {
    mockedIsGatewayEnabled.mockReturnValue(false);

    await expect(listOperations(mockCurrency, "alice-party", 0)).rejects.toThrow("Not implemented");
    expect(mockedGetOperations).not.toHaveBeenCalled();
  });

  it("maps gateway native asset to AssetInfo with native instrument id (Amulet)", async () => {
    mockedGetOperations.mockResolvedValue({
      next: 0,
      operations: [
        createMockOperationView({
          asset: { type: "native", instrumentAdmin: "admin", instrumentId: "Amulet" },
        }),
      ],
    });

    const page = await listOperations(mockCurrency, "alice-party", 0);

    expect(page.items).toHaveLength(1);
    expect(page.items[0].asset).toEqual({ type: "Amulet" });
  });

  it("maps token asset to AssetInfo with assetReference and assetOwner", async () => {
    mockedGetOperations.mockResolvedValue({
      next: 0,
      operations: [
        createMockOperationView({
          asset: {
            type: "token",
            instrumentAdmin: "token-admin",
            instrumentId: "token-id",
          },
        }),
      ],
    });

    const page = await listOperations(mockCurrency, "alice-party", 0);

    expect(page.items[0].asset).toEqual({
      type: "token",
      assetReference: "token-id",
      assetOwner: "token-admin",
    });
  });

  it("treats missing asset as native instrument (Amulet)", async () => {
    mockedGetOperations.mockResolvedValue({
      next: 0,
      operations: [mockOperationViewWithoutAsset()],
    });

    const page = await listOperations(mockCurrency, "alice-party", 0);

    expect(page.items[0].asset).toEqual({ type: "Amulet" });
  });

  it("uses empty string when block hash is missing", async () => {
    mockedGetOperations.mockResolvedValue({
      next: 0,
      operations: [
        createMockOperationView({
          block: { height: 10, time: "2024-01-01T00:00:00.000Z" },
        }),
      ],
    });

    const page = await listOperations(mockCurrency, "alice-party", 0);

    expect(page.items[0].tx.hash).toBe("0xtxhash");
    expect(page.items[0].tx.block.hash).toBe("");
  });

  it("returns OUT when partyId is among senders", async () => {
    mockedGetOperations.mockResolvedValue({
      next: 0,
      operations: [createMockOperationView()],
    });

    const page = await listOperations(mockCurrency, "alice-party", 0);

    expect(page.items[0].type).toBe("OUT");
  });

  it("returns IN when partyId is not among senders", async () => {
    mockedGetOperations.mockResolvedValue({
      next: 0,
      operations: [createMockOperationView()],
    });

    const page = await listOperations(mockCurrency, "other-party", 0);

    expect(page.items[0].type).toBe("IN");
  });

  it("skips operations that are not Send or lack transfers", async () => {
    mockedGetOperations.mockResolvedValue({
      next: 0,
      operations: [
        createMockOperationView({ type: "Receive" }),
        createMockOperationView({ transfers: [] }),
        mockOperationViewWithoutTransfers(),
      ],
    });

    const page = await listOperations(mockCurrency, "alice-party", 0);

    expect(page.items).toHaveLength(0);
  });

  it("passes pagination options to getOperations", async () => {
    mockedGetOperations.mockResolvedValue({ next: 5, operations: [] });

    const page = await listOperations(mockCurrency, "alice-party", 3, "10", 20);

    expect(mockedGetOperations).toHaveBeenCalledWith(mockCurrency, "alice-party", {
      cursor: 10,
      minOffset: 3,
      limit: 20,
    });
    expect(page.next).toBe("5");
  });
});
