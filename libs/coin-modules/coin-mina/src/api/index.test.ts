/* eslint-disable @typescript-eslint/consistent-type-assertions */
jest.mock("@ledgerhq/live-network");
jest.mock("@ledgerhq/logs");
jest.mock("../config");

import { LedgerAPI5xx } from "@ledgerhq/errors";
import network from "@ledgerhq/live-network";
import { getCoinConfig } from "../config";
import {
  MAINNET_NETWORK_IDENTIFIER,
  MINA_API_RETRY_COUNT,
  MINA_DECIMALS,
  MINA_SYMBOL,
  MINA_TOKEN_ID,
} from "../consts";
import { ValidatorInfoFromAPI } from "./types";
import {
  makeNetworkRequest,
  addNetworkIdentifier,
  buildAccountIdentifier,
  makeTransferPayload,
  makeDelegateChangePayload,
  fetchNetworkStatus,
  fetchAccountBalance,
  fetchAccountTransactions,
  rosettaGetBlockInfo,
  fetchTransactionMetadata,
  rosettaSubmitTransaction,
  getEpochInfo,
  getDelegateAccount,
  fetchValidators,
} from "./index";

const mockNetwork = network as jest.MockedFunction<typeof network>;
const mockGetCoinConfig = getCoinConfig as jest.MockedFunction<typeof getCoinConfig>;

// ── makeNetworkRequest tests ──

describe("makeNetworkRequest", () => {
  let setTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((fn: TimerHandler) => {
      if (typeof fn === "function") fn();
      return 0 as unknown as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
  });

  it("should return data on successful 200 response", async () => {
    mockNetwork.mockResolvedValue({ status: 200, data: { result: "ok" } } as any);

    const result = await makeNetworkRequest({
      method: "POST",
      url: "https://example.com/api",
      data: { key: "value" },
    });

    expect(result).toEqual({ result: "ok" });
    expect(mockNetwork).toHaveBeenCalledWith({
      method: "POST",
      url: "https://example.com/api",
      timeout: 120000,
      data: { key: "value" },
    });
  });

  it("should retry on LedgerAPI5xx 502 up to MINA_API_RETRY_COUNT times", async () => {
    const error502 = new LedgerAPI5xx("API HTTP 502", {
      status: 502,
      url: "/test",
      method: "POST",
    });
    mockNetwork.mockRejectedValue(error502);

    await expect(
      makeNetworkRequest({
        method: "POST",
        url: "https://example.com/api",
        data: {},
      }),
    ).rejects.toThrow("API HTTP 502");

    expect(mockNetwork).toHaveBeenCalledTimes(MINA_API_RETRY_COUNT + 1);
  });

  it("should succeed after 502 retries if a subsequent call succeeds", async () => {
    const error502 = new LedgerAPI5xx("API HTTP 502", {
      status: 502,
      url: "/test",
      method: "POST",
    });
    mockNetwork
      .mockRejectedValueOnce(error502)
      .mockResolvedValueOnce({ status: 200, data: { success: true } } as any);

    const result = await makeNetworkRequest({
      method: "POST",
      url: "https://example.com/api",
      data: {},
    });

    expect(result).toEqual({ success: true });
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });

  it("should retry on LedgerAPI5xx 503", async () => {
    const error503 = new LedgerAPI5xx("API HTTP 503", {
      status: 503,
      url: "/test",
      method: "POST",
    });
    mockNetwork
      .mockRejectedValueOnce(error503)
      .mockResolvedValueOnce({ status: 200, data: { ok: true } } as any);

    const result = await makeNetworkRequest({
      method: "POST",
      url: "https://example.com/api",
      data: {},
    });

    expect(result).toEqual({ ok: true });
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });

  it("should throw on non-200 status with object error data", async () => {
    mockNetwork.mockResolvedValue({
      status: 400,
      data: { error: "bad request" },
    } as any);

    await expect(
      makeNetworkRequest({
        method: "POST",
        url: "https://example.com/api",
        data: {},
      }),
    ).rejects.toThrow('{"error":"bad request"}');
  });

  it("should throw on non-200 status with string error data", async () => {
    mockNetwork.mockResolvedValue({
      status: 500,
      data: "Internal Server Error",
    } as any);

    await expect(
      makeNetworkRequest({
        method: "POST",
        url: "https://example.com/api",
        data: {},
      }),
    ).rejects.toThrow("Internal Server Error");
  });

  it("should retry on ECONNABORTED up to MINA_API_RETRY_COUNT times", async () => {
    const timeoutError = Object.assign(new Error("request timeout"), {
      code: "ECONNABORTED" as const,
    });

    mockNetwork.mockRejectedValue(timeoutError);

    await expect(
      makeNetworkRequest({
        method: "POST",
        url: "https://example.com/api",
        data: {},
      }),
    ).rejects.toThrow("request timeout");

    expect(mockNetwork).toHaveBeenCalledTimes(MINA_API_RETRY_COUNT + 1);
  });

  it("should succeed after ECONNABORTED retries if a subsequent call succeeds", async () => {
    const timeoutError = Object.assign(new Error("timeout"), { code: "ECONNABORTED" as const });

    mockNetwork
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce({ status: 200, data: { recovered: true } } as any);

    const result = await makeNetworkRequest({
      method: "POST",
      url: "https://example.com/api",
      data: {},
    });

    expect(result).toEqual({ recovered: true });
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });

  it("should not retry on non-retryable errors", async () => {
    mockNetwork.mockRejectedValue(new Error("unexpected error"));

    await expect(
      makeNetworkRequest({
        method: "POST",
        url: "https://example.com/api",
        data: {},
      }),
    ).rejects.toThrow("unexpected error");
    expect(mockNetwork).toHaveBeenCalledTimes(1);
  });

  it("should apply exponential backoff delay between retries", async () => {
    const error502 = new LedgerAPI5xx("API HTTP 502", {
      status: 502,
      url: "/test",
      method: "POST",
    });
    mockNetwork
      .mockRejectedValueOnce(error502)
      .mockRejectedValueOnce(error502)
      .mockResolvedValueOnce({ status: 200, data: { ok: true } } as any);

    await makeNetworkRequest({
      method: "POST",
      url: "https://example.com/api",
      data: {},
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 1000);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 2000);
  });

  it("should rethrow generic Error instances", async () => {
    mockNetwork.mockRejectedValue(new Error("some error"));

    await expect(
      makeNetworkRequest({
        method: "POST",
        url: "https://example.com/api",
        data: {},
      }),
    ).rejects.toThrow("some error");
  });

  it("should rethrow unknown errors", async () => {
    mockNetwork.mockRejectedValue("string error");

    await expect(
      makeNetworkRequest({
        method: "POST",
        url: "https://example.com/api",
        data: {},
      }),
    ).rejects.toBe("string error");
  });

  it("should use custom timeout when provided", async () => {
    mockNetwork.mockResolvedValue({ status: 200, data: {} } as any);

    await makeNetworkRequest({
      method: "GET",
      url: "https://example.com/api",
      data: {},
      timeout: 5000,
    });

    expect(mockNetwork).toHaveBeenCalledWith(expect.objectContaining({ timeout: 5000 }));
  });
});

// ── Rosetta utils tests ──

describe("addNetworkIdentifier", () => {
  it("should add network identifier to an empty object", () => {
    const result = addNetworkIdentifier({});
    expect(result).toEqual(MAINNET_NETWORK_IDENTIFIER);
  });

  it("should add network identifier to an object with existing properties", () => {
    const testObj = { test: "value" };
    const result = addNetworkIdentifier(testObj);
    expect(result).toEqual({
      ...MAINNET_NETWORK_IDENTIFIER,
      test: "value",
    });
  });

  it("should override network identifier properties if they exist in input object", () => {
    const testObj = { blockchain: "mina" };
    const result = addNetworkIdentifier(testObj);
    expect(result.network_identifier.blockchain).toEqual("mina");
  });
});

describe("buildAccountIdentifier", () => {
  it("should build correct account identifier with given address", () => {
    const testAddress = "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdtNtB5sNVpxyRwWGcDEhpMzc8g";
    const result = buildAccountIdentifier(testAddress);

    expect(result).toEqual({
      account_identifier: {
        address: testAddress,
        metadata: {
          token_id: MINA_TOKEN_ID,
        },
      },
    });
  });

  it("should throw when address is empty", () => {
    expect(() => buildAccountIdentifier("")).toThrow("Address is required");
  });
});

describe("makeTransferPayload", () => {
  const fromAddr = "sender-address";
  const toAddr = "recipient-address";
  const feeNano = 1000000;
  const valueNano = 5000000;

  it("should create a valid transfer payload with three operations", () => {
    const result = makeTransferPayload(fromAddr, toAddr, feeNano, valueNano);

    expect(result.operations).toHaveLength(3);
  });

  it("should correctly create fee payment operation", () => {
    const result = makeTransferPayload(fromAddr, toAddr, feeNano, valueNano);

    const feeOp = result.operations[0];
    expect(feeOp.operation_identifier.index).toBe(0);
    expect(feeOp.type).toBe("fee_payment");
    expect(feeOp.account.address).toBe(fromAddr);
    expect(feeOp.amount?.value).toBe("-" + feeNano.toString());
    expect(feeOp.amount?.currency.symbol).toBe(MINA_SYMBOL);
    expect(feeOp.amount?.currency.decimals).toBe(MINA_DECIMALS);
  });

  it("should correctly create payment source operation", () => {
    const result = makeTransferPayload(fromAddr, toAddr, feeNano, valueNano);

    const sourceOp = result.operations[1];
    expect(sourceOp.operation_identifier.index).toBe(1);
    expect(sourceOp.type).toBe("payment_source_dec");
    expect(sourceOp.account.address).toBe(fromAddr);
    expect(sourceOp.amount?.value).toBe("-" + valueNano.toString());
  });

  it("should correctly create payment receiver operation with related operation", () => {
    const result = makeTransferPayload(fromAddr, toAddr, feeNano, valueNano);

    const receiverOp = result.operations[2];
    expect(receiverOp.operation_identifier.index).toBe(2);
    expect(receiverOp.type).toBe("payment_receiver_inc");
    expect(receiverOp.account.address).toBe(toAddr);
    expect(receiverOp.amount?.value).toBe(valueNano.toString());
    expect(receiverOp.related_operations).toEqual([{ index: 1 }]);
  });

  it("should handle zero values correctly", () => {
    const result = makeTransferPayload(fromAddr, toAddr, 0, 0);

    expect(result.operations[0].amount?.value).toBe("-0");
    expect(result.operations[1].amount?.value).toBe("-0");
    expect(result.operations[2].amount?.value).toBe("0");
  });

  it("should throw when from address is empty", () => {
    expect(() => makeTransferPayload("", toAddr, 100, 100)).toThrow(
      "Both from and to addresses are required",
    );
  });

  it("should throw when to address is empty", () => {
    expect(() => makeTransferPayload(fromAddr, "", 100, 100)).toThrow(
      "Both from and to addresses are required",
    );
  });

  it("should throw when fee is negative", () => {
    expect(() => makeTransferPayload(fromAddr, toAddr, -1, 100)).toThrow(
      "Fee and value cannot be negative",
    );
  });

  it("should throw when value is negative", () => {
    expect(() => makeTransferPayload(fromAddr, toAddr, 100, -1)).toThrow(
      "Fee and value cannot be negative",
    );
  });
});

describe("makeDelegateChangePayload", () => {
  const fromAddr = "sender-address";
  const toAddr = "delegate-target";

  it("should create a valid delegate change payload with two operations", () => {
    const result = makeDelegateChangePayload(fromAddr, toAddr, 1000);

    expect(result.operations).toHaveLength(2);
  });

  it("should correctly create fee payment operation", () => {
    const result = makeDelegateChangePayload(fromAddr, toAddr, 1000);

    const feeOp = result.operations[0];
    expect(feeOp.operation_identifier.index).toBe(0);
    expect(feeOp.type).toBe("fee_payment");
    expect(feeOp.account.address).toBe(fromAddr);
    expect(feeOp.amount?.value).toBe("-1000");
    expect(feeOp.amount?.currency.symbol).toBe(MINA_SYMBOL);
    expect(feeOp.amount?.currency.decimals).toBe(MINA_DECIMALS);
  });

  it("should correctly create delegate change operation", () => {
    const result = makeDelegateChangePayload(fromAddr, toAddr, 1000);

    const delegateOp = result.operations[1];
    expect(delegateOp.operation_identifier.index).toBe(1);
    expect(delegateOp.type).toBe("delegate_change");
    expect(delegateOp.account.address).toBe(fromAddr);
    expect(delegateOp.metadata?.delegate_change_target).toBe(toAddr);
    expect(delegateOp.amount).toBeUndefined();
  });

  it("should throw when from address is empty", () => {
    expect(() => makeDelegateChangePayload("", toAddr, 1000)).toThrow(
      "Both from and to addresses are required",
    );
  });

  it("should throw when to address is empty", () => {
    expect(() => makeDelegateChangePayload(fromAddr, "", 1000)).toThrow(
      "Both from and to addresses are required",
    );
  });

  it("should throw when fee is negative", () => {
    expect(() => makeDelegateChangePayload(fromAddr, toAddr, -1)).toThrow("Fee cannot be negative");
  });
});

// ── Rosetta API function tests ──

describe("rosetta API functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinConfig.mockReturnValue({
      infra: {
        API_MINA_ROSETTA_NODE: "https://rosetta.example.com",
        API_MINA_GRAPHQL_NODE: "",
        API_VALIDATORS_BASE_URL: "",
      },
    } as any);
  });

  describe("fetchNetworkStatus", () => {
    it("should call rosetta /network/status endpoint", async () => {
      const mockResponse = {
        current_block_identifier: { index: 100, hash: "hash" },
      };
      mockNetwork.mockResolvedValue({ status: 200, data: mockResponse } as any);

      const result = await fetchNetworkStatus();

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: "https://rosetta.example.com/network/status",
        }),
      );
    });
  });

  describe("fetchAccountBalance", () => {
    it("should call rosetta /account/balance endpoint with address", async () => {
      const mockResponse = {
        balances: [{ metadata: { total_balance: 1000, liquid_balance: 900 } }],
      };
      mockNetwork.mockResolvedValue({ status: 200, data: mockResponse } as any);

      const result = await fetchAccountBalance("B62qtest");

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://rosetta.example.com/account/balance",
        }),
      );
    });
  });

  describe("fetchAccountTransactions", () => {
    it("should fetch all pages of transactions", async () => {
      mockNetwork
        .mockResolvedValueOnce({
          status: 200,
          data: { transactions: [{ id: "tx1" }], next_offset: 100 },
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          data: { transactions: [{ id: "tx2" }], next_offset: undefined },
        } as any);

      const result = await fetchAccountTransactions("B62qtest");

      expect(result).toHaveLength(2);
      expect(mockNetwork).toHaveBeenCalledTimes(2);
    });

    it("should start from specified offset", async () => {
      mockNetwork.mockResolvedValue({
        status: 200,
        data: { transactions: [{ id: "tx1" }], next_offset: undefined },
      } as any);

      await fetchAccountTransactions("B62qtest", 50);

      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ offset: 50 }),
        }),
      );
    });

    it("should return empty array when no transactions", async () => {
      mockNetwork.mockResolvedValue({
        status: 200,
        data: { transactions: [], next_offset: undefined },
      } as any);

      const result = await fetchAccountTransactions("B62qtest");

      expect(result).toEqual([]);
    });
  });

  describe("rosettaGetBlockInfo", () => {
    it("should call rosetta /block endpoint with block height", async () => {
      const mockResponse = {
        block: { block_identifier: { index: 50, hash: "bh" }, timestamp: 12345 },
      };
      mockNetwork.mockResolvedValue({ status: 200, data: mockResponse } as any);

      const result = await rosettaGetBlockInfo(50);

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://rosetta.example.com/block",
        }),
      );
    });
  });

  describe("fetchTransactionMetadata", () => {
    it("should preprocess then fetch metadata", async () => {
      const preprocessResponse = {
        options: { sender: "src", token_id: "tid", receiver: "dst" },
      };
      const metadataResponse = {
        metadata: { nonce: "10", sender: "src" },
        suggested_fee: [{ value: "100" }],
      };
      mockNetwork
        .mockResolvedValueOnce({ status: 200, data: preprocessResponse } as any)
        .mockResolvedValueOnce({ status: 200, data: metadataResponse } as any);

      const result = await fetchTransactionMetadata("src", "dst", 100, 1000);

      expect(result).toEqual(metadataResponse);
      expect(mockNetwork).toHaveBeenCalledTimes(2);
      // First call: preprocess
      expect((mockNetwork.mock.calls[0] as any)[0]).toEqual(
        expect.objectContaining({
          url: "https://rosetta.example.com/construction/preprocess",
        }),
      );
      // Second call: metadata
      expect((mockNetwork.mock.calls[1] as any)[0]).toEqual(
        expect.objectContaining({
          url: "https://rosetta.example.com/construction/metadata",
        }),
      );
    });
  });

  describe("rosettaSubmitTransaction", () => {
    it("should submit transaction blob to rosetta", async () => {
      const mockResponse = { transaction_identifier: { hash: "txhash" } };
      mockNetwork.mockResolvedValue({ status: 200, data: mockResponse } as any);

      const result = await rosettaSubmitTransaction('{"signed":"tx"}');

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://rosetta.example.com/construction/submit",
        }),
      );
    });
  });
});

// ── GraphQL API function tests ──

describe("graphql API functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinConfig.mockReturnValue({
      infra: {
        API_MINA_GRAPHQL_NODE: "https://graphql.example.com",
        API_MINA_ROSETTA_NODE: "",
        API_VALIDATORS_BASE_URL: "",
      },
    } as any);
  });

  describe("getEpochInfo", () => {
    it("should fetch epoch info from graphql", async () => {
      const mockResponse = {
        data: {
          daemonStatus: {
            consensusTimeNow: {
              epoch: "42",
              slot: "100",
              globalSlot: "30000",
              startTime: "1000",
              endTime: "2000",
            },
          },
        },
      };
      mockNetwork.mockResolvedValue({ status: 200, data: mockResponse } as any);

      const result = await getEpochInfo();

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: "https://graphql.example.com",
        }),
      );
    });
  });

  describe("getDelegateAccount", () => {
    const validPublicKey = "B62qiVhtBtqakq8sNTHdCTXn6tETSK6gtsmNHRn1WdLqjGLpsHbw1xc";

    it("should fetch delegate account for given address using GraphQL variables", async () => {
      const mockResponse = {
        data: {
          account: {
            delegateAccount: { publicKey: "B62qdelegate" },
          },
        },
      };
      mockNetwork.mockResolvedValue({ status: 200, data: mockResponse } as any);

      const result = await getDelegateAccount(validPublicKey);

      expect(result).toEqual(mockResponse);
      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: "https://graphql.example.com",
          data: expect.objectContaining({
            query: expect.stringContaining("GetDelegateAccount"),
            variables: { publicKey: validPublicKey },
          }),
        }),
      );
    });

    it("should reject invalid public keys before calling the network", async () => {
      await expect(getDelegateAccount("not-a-mina-key")).rejects.toThrow("Invalid Mina public key");
      expect(mockNetwork).not.toHaveBeenCalled();
    });
  });
});

// ── fetchValidators tests ──

const makeValidator = (overrides?: Partial<ValidatorInfoFromAPI>): ValidatorInfoFromAPI => ({
  validatorAddress: "B62qvalidator",
  validatorName: "Test Validator",
  validatorFee: 5,
  delegatorsCount: 100,
  stake: 1000000,
  nextEpochStake: 1000000,
  nextEpochDelegationsCount: 50,
  stakePercent: 1.5,
  networkShare: 2.0,
  canonicalBlocksCount: 500,
  allBlocksCount: 600,
  isVerified: true,
  isActive: true,
  diffStake: 0,
  diffDelegatorsCount: 0,
  validatorImg: "https://img.example.com/v.png",
  description: "A good validator",
  website: "https://example.com",
  ...overrides,
});

describe("fetchValidators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinConfig.mockReturnValue({
      infra: {
        API_VALIDATORS_BASE_URL: "https://validators.example.com",
        API_MINA_ROSETTA_NODE: "",
        API_MINA_GRAPHQL_NODE: "",
      },
    } as any);
  });

  it("should fetch a single page of validators", async () => {
    const validator = makeValidator();
    mockNetwork.mockResolvedValue({
      data: { content: [validator], last: true },
    } as any);

    const result = await fetchValidators();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      address: "B62qvalidator",
      name: "Test Validator",
      fee: 5,
      delegatorsCount: 100,
      validatorLogo: "https://img.example.com/v.png",
      identityName: "Test Validator",
      description: "A good validator",
      website: "https://example.com",
      stake: 1000000,
      delegations: 50,
      blocksCreated: 500,
    });
  });

  it("should paginate through multiple pages", async () => {
    const v1 = makeValidator({ validatorAddress: "B62q_page1" });
    const v2 = makeValidator({ validatorAddress: "B62q_page2" });

    mockNetwork
      .mockResolvedValueOnce({ data: { content: [v1], last: false } } as any)
      .mockResolvedValueOnce({ data: { content: [v2], last: true } } as any);

    const result = await fetchValidators();

    expect(result).toHaveLength(2);
    expect(result[0].address).toBe("B62q_page1");
    expect(result[1].address).toBe("B62q_page2");
    expect(mockNetwork).toHaveBeenCalledTimes(2);
  });

  it("should handle validators with undefined optional fields", async () => {
    const validator = makeValidator({
      validatorImg: undefined,
      description: undefined,
      website: undefined,
    } as unknown as Partial<ValidatorInfoFromAPI>);
    mockNetwork.mockResolvedValue({
      data: { content: [validator], last: true },
    } as any);

    const result = await fetchValidators();

    expect(result[0].validatorLogo).toBeUndefined();
    expect(result[0].description).toBeUndefined();
    expect(result[0].website).toBeUndefined();
  });

  it("should return empty array when no validators", async () => {
    mockNetwork.mockResolvedValue({
      data: { content: [], last: true },
    } as any);

    const result = await fetchValidators();

    expect(result).toEqual([]);
  });
});
