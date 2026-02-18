import aleoConfig from "../config";
import { EXPLORER_TRANSFER_TYPES } from "../constants";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import {
  getNetworkConfig,
  parseMicrocredits,
  determineTransactionType,
  patchAccountWithViewKey,
} from "./utils";

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

describe("patchAccountWithViewKey", () => {
  it("should encode viewKey in account id", () => {
    const mockViewKey = "AViewKey1mockviewkey";
    const mockAccount = getMockedAccount({
      id: "js:2:aleo:aleo1test:",
      operations: [],
    });

    const result = patchAccountWithViewKey(mockAccount, mockViewKey);

    expect(result.id).not.toBe(mockAccount.id);
    expect(result.id).toBe(`js:2:aleo:aleo1test::${mockViewKey}`);
  });

  it("should update operation ids with new account id", () => {
    const mockViewKey = "AViewKey1mockviewkey";
    const mockOp1 = getMockedOperation({
      id: "js:2:aleo:aleo1test:-op1-OUT",
      accountId: "js:2:aleo:aleo1test:",
      hash: "op1",
      type: "OUT",
    });

    const mockOp2 = getMockedOperation({
      id: "js:2:aleo:aleo1test:-op2-IN",
      accountId: "js:2:aleo:aleo1test:",
      hash: "op2",
      type: "IN",
    });

    const mockPendingOp1 = getMockedOperation({
      id: "js:2:aleo:aleo1test:-pending1-OUT",
      accountId: "js:2:aleo:aleo1test:",
      hash: "pending1",
      type: "OUT",
    });

    const mockPendingOp2 = getMockedOperation({
      id: "js:2:aleo:aleo1test:-pending2-IN",
      accountId: "js:2:aleo:aleo1test:",
      hash: "pending2",
      type: "IN",
    });

    const mockAccount = getMockedAccount({
      id: "js:2:aleo:aleo1test:",
      operations: [mockOp1, mockOp2],
      pendingOperations: [mockPendingOp1, mockPendingOp2],
    });

    const result = patchAccountWithViewKey(mockAccount, mockViewKey);

    expect(result.operations).toEqual([
      expect.objectContaining({
        id: `js:2:aleo:aleo1test::${mockViewKey}-op1-OUT`,
        accountId: `js:2:aleo:aleo1test::${mockViewKey}`,
      }),
      expect.objectContaining({
        id: `js:2:aleo:aleo1test::${mockViewKey}-op2-IN`,
        accountId: `js:2:aleo:aleo1test::${mockViewKey}`,
      }),
    ]);
    expect(result.pendingOperations).toEqual([
      expect.objectContaining({
        id: `js:2:aleo:aleo1test::${mockViewKey}-pending1-OUT`,
        accountId: `js:2:aleo:aleo1test::${mockViewKey}`,
      }),
      expect.objectContaining({
        id: `js:2:aleo:aleo1test::${mockViewKey}-pending2-IN`,
        accountId: `js:2:aleo:aleo1test::${mockViewKey}`,
      }),
    ]);
  });

  it("should throw if viewKey is missing", () => {
    const mockAccount = getMockedAccount({
      id: "js:2:aleo:aleo1test:",
      operations: [],
    });

    expect(() => patchAccountWithViewKey(mockAccount, "")).toThrow();
  });
});

describe("determineTransactionType", () => {
  it("should return 'private' for transfer_private function", () => {
    const result = determineTransactionType(EXPLORER_TRANSFER_TYPES.PRIVATE, "OUT");

    expect(result).toBe("private");
  });

  it("should return 'public' for transfer_public function", () => {
    const result = determineTransactionType(EXPLORER_TRANSFER_TYPES.PUBLIC, "OUT");

    expect(result).toBe("public");
  });

  it("should return 'private' for transfer_private regardless of operationType", () => {
    const result = determineTransactionType(EXPLORER_TRANSFER_TYPES.PRIVATE, "IN");

    expect(result).toBe("private");
  });

  it("should return 'public' for transfer_public regardless of operationType", () => {
    const result = determineTransactionType(EXPLORER_TRANSFER_TYPES.PUBLIC, "IN");

    expect(result).toBe("public");
  });

  it("should return 'private' when functionId ends with to_private", () => {
    const result = determineTransactionType("transfer_public_to_private", "IN");

    expect(result).toBe("private");
  });

  it("should return 'public' when functionId ends with to_public", () => {
    const result = determineTransactionType("transfer_private_to_public", "IN");

    expect(result).toBe("public");
  });

  it("should return 'public' when functionId does not end with to_private or to_public", () => {
    const result = determineTransactionType("some_other_function", "IN");

    expect(result).toBe("public");
  });

  it("should return 'private' when functionId starts with transfer_private", () => {
    const result = determineTransactionType("transfer_private_to_public", "OUT");

    expect(result).toBe("private");
  });

  it("should return 'public' when functionId starts with transfer_public", () => {
    const result = determineTransactionType("transfer_public_to_private", "OUT");

    expect(result).toBe("public");
  });

  it("should return 'private' when functionId starts with transfer_private (without to_)", () => {
    const result = determineTransactionType("transfer_private_custom", "OUT");

    expect(result).toBe("private");
  });

  it("should return 'public' when functionId does not start with transfer_private or transfer_public", () => {
    const result = determineTransactionType("some_other_function", "OUT");

    expect(result).toBe("public");
  });

  it("should default to 'public' for unknown function with FEES operationType", () => {
    const result = determineTransactionType("unknown_function", "FEES");

    expect(result).toBe("public");
  });

  it("should default to 'public' for unknown function with NONE operationType", () => {
    const result = determineTransactionType("unknown_function", "NONE");

    expect(result).toBe("public");
  });

  it("should handle empty functionId with IN operationType", () => {
    const result = determineTransactionType("", "IN");

    expect(result).toBe("public");
  });

  it("should handle empty functionId with OUT operationType", () => {
    const result = determineTransactionType("", "OUT");

    expect(result).toBe("public");
  });
});
