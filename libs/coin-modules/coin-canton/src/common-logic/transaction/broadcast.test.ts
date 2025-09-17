import { submit } from "../../network/gateway";
import * as coinConfigModule from "../../config";
import { broadcast } from "./broadcast";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("../../network/gateway", () => ({
  submit: jest.fn(),
}));

const mockSerialized = JSON.stringify({
  serialized: "serialized-tx",
  signature: "signature__PARTY__alice:123",
});

const mockCurrency = {
  id: "canton_network",
} as unknown as CryptoCurrency;

describe("broadcast", () => {
  const mockGetCoinConfig = jest.spyOn(coinConfigModule.default, "getCoinConfig");

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast", async () => {
    mockGetCoinConfig.mockReturnValue({
      useGateway: true,
    } as any);

    (submit as jest.Mock).mockResolvedValue({ update_id: "my-update-id" });

    const result = await broadcast(mockCurrency, mockSerialized);

    expect(submit).toHaveBeenCalledWith(mockCurrency, "alice:123", "serialized-tx", "signature");
    expect(result).toEqual("my-update-id");
  });

  it("should throw an error when useGateway is false (not implemented with node)", async () => {
    mockGetCoinConfig.mockReturnValue({
      useGateway: false,
    } as any);

    await expect(broadcast(mockCurrency, mockSerialized)).rejects.toThrow("Not implemented");
    expect(submit).not.toHaveBeenCalled();
  });
});
