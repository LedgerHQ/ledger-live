import { genericValidateAddress } from "./validateAddress";

const mockValidateAddress = jest.fn();
const mockGetCoinModuleApi = jest.fn();

jest.mock("./api", () => ({
  getCoinModuleApi: (...a: any[]) => mockGetCoinModuleApi(...a),
}));

describe("genericValidateAddress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinModuleApi.mockResolvedValue({
      validateAddress: (...a: any[]) => mockValidateAddress(...a),
    });
  });

  it("returns true for a valid address", async () => {
    mockValidateAddress.mockResolvedValue(true);
    const result = await genericValidateAddress("xrp", "local")("rValidAddress", {});
    expect(result).toBe(true);
  });

  it("returns false for an invalid address", async () => {
    mockValidateAddress.mockResolvedValue(false);
    const result = await genericValidateAddress("xrp", "local")("invalid", {});
    expect(result).toBe(false);
  });

  it("resolves the API with parameters.currencyId when provided", async () => {
    mockValidateAddress.mockResolvedValue(true);
    await genericValidateAddress("evm", "local")("0xAddress", { currencyId: "ethereum" });
    expect(mockGetCoinModuleApi).toHaveBeenCalledWith("ethereum", "local");
  });

  it("falls back to network when parameters.currencyId is absent", async () => {
    mockValidateAddress.mockResolvedValue(true);
    await genericValidateAddress("stellar", "local")("GADDRESS", {});
    expect(mockGetCoinModuleApi).toHaveBeenCalledWith("stellar", "local");
  });

  it("propagates errors thrown by api.validateAddress", async () => {
    mockValidateAddress.mockRejectedValue(new Error("validation failed"));
    await expect(genericValidateAddress("evm", "local")("0xBad", {})).rejects.toThrow(
      "validation failed",
    );
  });
});
