import { getBalance as getBalanceFromNetwork } from "../../network/gateway";
import * as coinConfigModule from "../../config";
import { getBalance } from "./getBalance";
import { Balance } from "@ledgerhq/coin-framework/api/types";

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
        instrumentId: "native-id",
        amount: "1000",
        locked: false,
      },
      {
        instrumentId: "token-123",
        amount: "5000",
        locked: true,
      },
    ];

    (getBalanceFromNetwork as jest.Mock).mockResolvedValue(mockInstruments);

    const result = await getBalance("party-id");

    expect(getBalanceFromNetwork).toHaveBeenCalledWith("party-id");
    expect(result).toEqual<Balance[]>([
      {
        value: BigInt(1000),
        locked: BigInt(0),
        asset: { type: "native" },
      },
      {
        value: BigInt(5000),
        locked: BigInt(5000),
        asset: { type: "token", assetReference: "token-123" },
      },
    ]);
  });

  it("should throw an error when useGateway is false (not implemented with node)", async () => {
    mockGetCoinConfig.mockReturnValue({
      useGateway: false,
    } as any);

    await expect(getBalance("party-id")).rejects.toThrow("Not implemented");
    expect(getBalanceFromNetwork).not.toHaveBeenCalled();
  });
});
