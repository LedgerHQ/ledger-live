import aleoConfig from "../config";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getNetworkConfig, parseMicrocredits } from "./utils";

jest.mock("../config");

const mockedAleoConfig = jest.mocked(aleoConfig);

describe("getNetworkConfig", () => {
  const mockCurrency = getMockedCurrency();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return network config with correct structure", () => {
    const mockConfig = getMockedConfig("mainnet");

    mockedAleoConfig.getCoinConfig.mockReturnValue(mockConfig);

    const result = getNetworkConfig(mockCurrency);

    expect(result).toEqual({
      nodeUrl: "https://node.example.com",
      sdkUrl: "https://sdk.example.com",
      networkType: "mainnet",
    });
  });

  it("should call getCoinConfig with correct currency", () => {
    const mockConfig = getMockedConfig("testnet");

    mockedAleoConfig.getCoinConfig.mockReturnValue(mockConfig);

    getNetworkConfig(mockCurrency);

    expect(aleoConfig.getCoinConfig).toHaveBeenCalledTimes(1);
    expect(aleoConfig.getCoinConfig).toHaveBeenCalledWith(mockCurrency);
  });
});

describe("parseMicrocredits", () => {
  it("should parse valid microcredits string and remove u64 suffix", () => {
    const result = parseMicrocredits("1000000u64");

    expect(result).toBe("1000000");
  });

  it("should parse valid private microcredits string and remove u64.private suffix", () => {
    const result = parseMicrocredits("1000000u64.private");

    expect(result).toBe("1000000");
  });

  it("should parse zero microcredits", () => {
    const result = parseMicrocredits("0u64");

    expect(result).toBe("0");
  });

  it("should parse zero private microcredits", () => {
    const result = parseMicrocredits("0u64.private");

    expect(result).toBe("0");
  });

  it("should parse large microcredits values", () => {
    const result = parseMicrocredits("999999999999999u64");

    expect(result).toBe("999999999999999");
  });

  it("should parse microcredits with .private suffix", () => {
    const result = parseMicrocredits("1000000u64.private");

    expect(result).toBe("1000000");
  });

  it("should throw error when u64 suffix is missing", () => {
    const value = "1000000";
    expect(() => parseMicrocredits(value)).toThrow();
  });

  it("should throw error for invalid format", () => {
    const value = "1000000u32";
    expect(() => parseMicrocredits(value)).toThrow();
  });
});
