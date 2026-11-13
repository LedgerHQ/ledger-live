import type { CantonCoinConfig } from "../../config";
import { getBalance as getBalanceFromNetwork, isGatewayEnabled } from "../../network/gateway";
import {
  createMockCoinConfigValue,
  createMockContext,
  createMockInstrumentBalances,
} from "../../test/fixtures";
import { getBalance } from "../getBalance";

jest.mock("../../network/gateway", () => ({
  getBalance: jest.fn(),
  isGatewayEnabled: jest.fn(() => true),
}));

const mockedGetBalanceFromNetwork = jest.mocked(getBalanceFromNetwork);
const mockedIsGatewayEnabled = jest.mocked(isGatewayEnabled);
const createMockConfig = (useGateway: boolean, nativeInstrumentId?: string): CantonCoinConfig => ({
  ...createMockCoinConfigValue(),
  useGateway,
  ...(nativeInstrumentId ? { nativeInstrumentId } : {}),
});

describe("getBalance", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return adapted balances when useGateway is true", async () => {
    const config = createMockConfig(true, "native-id");
    const mockInstruments = createMockInstrumentBalances(2, [
      {
        instrument_id: "native-id",
        amount: "1000",
        utxo_count: 1,
        locked: false,
      },
      {
        instrument_id: "token-123",
        amount: "5000",
        utxo_count: 1,
        locked: true,
      },
    ]);

    mockedGetBalanceFromNetwork.mockResolvedValue(mockInstruments);

    const result = await getBalance(createMockContext(config), "test-party-id");

    expect(mockedGetBalanceFromNetwork).toHaveBeenCalledWith(config, "test-party-id");
    expect(result).toEqual([
      {
        value: BigInt(1000),
        locked: BigInt(0),
        asset: { type: "native-id" },
        utxoCount: 1,
        instrumentId: "native-id",
        adminId: "AmuletAdmin",
      },
      {
        value: BigInt(5000),
        locked: BigInt(5000),
        asset: { type: "token", assetReference: "token-123" },
        utxoCount: 1,
        instrumentId: "token-123",
        adminId: "AmuletAdmin",
      },
    ]);
  });

  it("should throw an error when useGateway is false (not implemented with node)", async () => {
    mockedIsGatewayEnabled.mockReturnValue(false);

    await expect(getBalance(createMockContext(), "test-party-id")).rejects.toThrow(
      "Not implemented",
    );
    expect(mockedGetBalanceFromNetwork).not.toHaveBeenCalled();
  });
});
