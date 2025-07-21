import BigNumber from "bignumber.js";
import { getUnit, mapTxToOps } from "./txn";
import { casperAccountHashFromPublicKey, isAddressValid } from "./addresses";
import * as fixtures from "../../test/fixtures";
import { ITxnHistoryData } from "../../api/types";
import { createNewTransaction as testCreateNewTransaction } from "./txn";

// Import Casper SDK mock for direct access to mocks
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockCasperSDK = require("casper-js-sdk");

// Mock the entire Casper SDK
jest.mock("casper-js-sdk", () => {
  const mockTransaction = { id: "mock-transaction" };
  const mockHelper = {
    createTransferTransaction: jest.fn().mockReturnValue(mockTransaction),
  };

  return {
    CasperNetwork: {
      create: jest.fn().mockResolvedValue(mockHelper),
    },
    PublicKey: {
      fromHex: jest.fn().mockReturnValue({ value: "mocked-public-key" }),
    },
    Transaction: jest.fn().mockImplementation(() => mockTransaction),
  };
});

jest.mock("@ledgerhq/coin-framework/operation", () => ({
  encodeOperationId: jest.fn(
    (accountId: string, hash: string, type: string) => `${accountId}-${hash}-${type}`,
  ),
}));

jest.mock("./addresses", () => ({
  casperAccountHashFromPublicKey: jest.fn((key: string) => `account-hash-${key}`),
  isAddressValid: jest.fn(),
}));

jest.mock("../../api", () => ({
  getCasperNodeRpcClient: jest.fn(),
}));

describe("txn", () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUnit", () => {
    test("should return the first unit of casper currency", () => {
      const unit = getUnit();
      expect(unit).toBeDefined();
      expect(unit.name).toBe("CSPR");
      expect(unit.code).toBe("CSPR");
      expect(unit.magnitude).toBe(9);
    });
  });

  describe("mapTxToOps", () => {
    const { mockAccountId } = fixtures.createMockAccountShapeData();
    const fees = new BigNumber("100000000");
    const mockTimestamp = "2023-01-01T12:00:00Z";

    beforeEach(() => {
      (casperAccountHashFromPublicKey as jest.Mock).mockImplementation(
        (key: string) => `account-hash-${key}`,
      );
    });

    test("should map an outgoing transaction to operation", () => {
      // Use a modified version of the fixture tx data
      const fixtureData = fixtures.createMockAccountShapeData();
      const txData: ITxnHistoryData = {
        ...fixtureData.mockTxs[0],
        timestamp: mockTimestamp,
        caller_public_key: "owner-public-key",
        args: {
          target: {
            cl_type: "PublicKey",
            parsed: "recipient-public-key",
          },
          amount: {
            parsed: "5000000000",
            cl_type: "U512",
          },
          id: {
            parsed: 12345,
            cl_type: {
              Option: "U64",
            },
          },
        },
        deploy_hash: "test-deploy-hash",
        status: "success",
        amount: "5000000000",
      };

      // Set up the owner address hash to match the from account hash
      (casperAccountHashFromPublicKey as jest.Mock).mockReturnValueOnce(
        "account-hash-owner-public-key",
      );
      (casperAccountHashFromPublicKey as jest.Mock).mockReturnValueOnce(
        "account-hash-recipient-public-key",
      );

      const mapper = mapTxToOps(mockAccountId, "account-hash-owner-public-key", fees);
      const operations = mapper(txData);

      expect(operations).toHaveLength(1);
      expect(operations[0]).toEqual({
        id: `${mockAccountId}-${txData.deploy_hash}-OUT`,
        hash: txData.deploy_hash,
        type: "OUT",
        value: new BigNumber("5000000000").plus(fees),
        fee: fees,
        blockHeight: 1,
        hasFailed: false,
        blockHash: null,
        accountId: mockAccountId,
        senders: ["account-hash-owner-public-key"],
        recipients: ["account-hash-recipient-public-key"],
        date: new Date(mockTimestamp),
        extra: {
          transferId: "12345",
        },
      });
    });

    test("should map an incoming transaction to operation", () => {
      const recipientAddressHash = "account-hash-owner-public-key";
      // Use a modified version of the fixture tx data
      const fixtureData = fixtures.createMockAccountShapeData();
      const txData: ITxnHistoryData = {
        ...fixtureData.mockTxs[0],
        timestamp: mockTimestamp,
        caller_public_key: "sender-public-key",
        args: {
          target: {
            cl_type: "PublicKey",
            parsed: "owner-public-key",
          },
          amount: {
            parsed: "5000000000",
            cl_type: "U512",
          },
          id: {
            parsed: 12345,
            cl_type: {
              Option: "U64",
            },
          },
        },
        deploy_hash: "test-deploy-hash",
        status: "success",
        amount: "5000000000",
      };

      (casperAccountHashFromPublicKey as jest.Mock).mockReturnValueOnce(
        "account-hash-sender-public-key",
      );
      (casperAccountHashFromPublicKey as jest.Mock).mockReturnValueOnce(recipientAddressHash);

      const mapper = mapTxToOps(mockAccountId, recipientAddressHash, fees);
      const operations = mapper(txData);

      expect(operations).toHaveLength(1);
      expect(operations[0]).toEqual({
        id: `${mockAccountId}-${txData.deploy_hash}-IN`,
        hash: txData.deploy_hash,
        type: "IN",
        value: new BigNumber("5000000000"),
        fee: fees,
        blockHeight: 1,
        hasFailed: false,
        blockHash: null,
        accountId: mockAccountId,
        senders: ["account-hash-sender-public-key"],
        recipients: [recipientAddressHash],
        date: new Date(mockTimestamp),
        extra: {
          transferId: "12345",
        },
      });
    });

    test("should map a failed transaction correctly", () => {
      // Use a modified version of the fixture tx data
      const fixtureData = fixtures.createMockAccountShapeData();
      const txData: ITxnHistoryData = {
        ...fixtureData.mockTxs[0],
        timestamp: mockTimestamp,
        caller_public_key: "owner-public-key",
        args: {
          target: {
            cl_type: "PublicKey",
            parsed: "recipient-public-key",
          },
          amount: {
            parsed: "5000000000",
            cl_type: "U512",
          },
          id: {
            parsed: 12345,
            cl_type: {
              Option: "U64",
            },
          },
        },
        deploy_hash: "test-deploy-hash",
        error_message: "Transaction failed due to insufficient funds",
        status: "failure",
        amount: "5000000000",
      };

      (casperAccountHashFromPublicKey as jest.Mock).mockReturnValueOnce(
        "account-hash-owner-public-key",
      );
      (casperAccountHashFromPublicKey as jest.Mock).mockReturnValueOnce(
        "account-hash-recipient-public-key",
      );

      const mapper = mapTxToOps(mockAccountId, "account-hash-owner-public-key", fees);
      const operations = mapper(txData);

      expect(operations).toHaveLength(1);
      expect(operations[0].hasFailed).toBe(true);
    });

    test("should handle target as account hash string directly", () => {
      // Use a modified version of the fixture tx data
      const fixtureData = fixtures.createMockAccountShapeData();
      const txData: ITxnHistoryData = {
        ...fixtureData.mockTxs[0],
        timestamp: mockTimestamp,
        caller_public_key: "owner-public-key",
        args: {
          target: {
            cl_type: {
              ByteArray: 32,
            },
            parsed: "account-hash-direct-address",
          },
          amount: {
            parsed: "5000000000",
            cl_type: "U512",
          },
          id: {
            parsed: 12345,
            cl_type: {
              Option: "U64",
            },
          },
        },
        deploy_hash: "test-deploy-hash",
        status: "success",
        amount: "5000000000",
      };

      (casperAccountHashFromPublicKey as jest.Mock).mockReturnValueOnce(
        "account-hash-owner-public-key",
      );

      const mapper = mapTxToOps(mockAccountId, "account-hash-owner-public-key", fees);
      const operations = mapper(txData);

      expect(operations).toHaveLength(1);
      expect(operations[0].recipients).toEqual(["account-hash-direct-address"]);
    });

    test("should catch and log errors when mapping fails", () => {
      const txData = {
        timestamp: mockTimestamp,
        caller_public_key: "owner-public-key",
        args: {
          // Intentionally missing the target field to cause an error
          amount: {
            parsed: "5000000000",
            cl_type: "U512",
          },
        },
        deploy_hash: "test-deploy-hash",
        block_hash: "block-hash-1",
        execution_type_id: 1,
        cost: "100000",
        payment_amount: "100000000",
        status: "success",
        amount: "5000000000",
      };

      const mapper = mapTxToOps(mockAccountId, "account-hash-owner-public-key", fees);
      const operations = mapper(txData as any);

      expect(operations).toEqual([]);
    });
  });

  describe("createNewTransaction", () => {
    const { mockAddress: mockSender } = fixtures.createMockAccountShapeData();
    const mockRecipient = fixtures.TEST_ADDRESSES.RECIPIENT_SECP256K1;
    const mockAmount = new BigNumber("5000000000");
    const mockFees = new BigNumber("100000000");
    const mockTransferId = fixtures.TEST_TRANSFER_IDS.VALID;

    // Direct access to the mocks from jest.mock
    const mockCreateNetwork = mockCasperSDK.CasperNetwork.create;
    const mockPublicKeyFromHex = mockCasperSDK.PublicKey.fromHex;

    beforeEach(() => {
      (isAddressValid as jest.Mock).mockReturnValue(true);
    });

    test("should throw error if recipient address is invalid", async () => {
      (isAddressValid as jest.Mock).mockReturnValue(false);

      await expect(
        testCreateNewTransaction(mockSender, mockRecipient, mockAmount, mockFees),
      ).rejects.toThrow();
    });

    test("should create a new transaction with valid parameters", async () => {
      const expectedTransaction = { id: "mock-transaction" };

      const result = await testCreateNewTransaction(
        mockSender,
        mockRecipient,
        mockAmount,
        mockFees,
        mockTransferId,
      );

      expect(result).toEqual(expectedTransaction);
      expect(mockCreateNetwork).toHaveBeenCalled();
      expect(mockPublicKeyFromHex).toHaveBeenCalledWith(mockSender);
      expect(mockPublicKeyFromHex).toHaveBeenCalledWith(mockRecipient);
    });
  });
});
