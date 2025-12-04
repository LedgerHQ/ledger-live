import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as coinConfigModule from "../../config";
import { getBalance as getBalanceFromNetwork } from "../../network/gateway";
import { getBalance } from "./getBalance";

const mockCurrency = {
  id: "canton_network",
} as unknown as CryptoCurrency;

jest.mock("../../network/gateway", () => ({
  getBalance: jest.fn(),
}));

describe("getBalance", () => {
  const mockGetCoinConfig = jest.spyOn(coinConfigModule.default, "getCoinConfig");

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return adapted balances when useGateway is true", async () => {
    mockGetCoinConfig.mockReturnValue({
      useGateway: true,
      nativeInstrumentId: "native-id",
    } as any);

    const mockInstruments = [
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
    ];

    (getBalanceFromNetwork as jest.Mock).mockResolvedValue(mockInstruments);

    const result = await getBalance(mockCurrency, "party-id");

    expect(getBalanceFromNetwork).toHaveBeenCalledWith(mockCurrency, "party-id");
    expect(result).toEqual([
      {
        value: BigInt(1000),
        locked: BigInt(0),
        asset: { type: "native" },
        utxoCount: 1,
        instrumentId: "native-id",
      },
      {
        value: BigInt(5000),
        locked: BigInt(5000),
        asset: { type: "token", assetReference: "token-123" },
        utxoCount: 1,
        instrumentId: "token-123",
      },
    ]);
  });

  it("should throw an error when useGateway is false (not implemented with node)", async () => {
    mockGetCoinConfig.mockReturnValue({
      useGateway: false,
    } as any);

    await expect(getBalance(mockCurrency, "party-id")).rejects.toThrow("Not implemented");
    expect(getBalanceFromNetwork).not.toHaveBeenCalled();
  });
});
