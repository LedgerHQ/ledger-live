import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedRecord } from "../__tests__/fixtures/api.fixture";
import { EXPLORER_TRANSFER_TYPES } from "../constants";
import type { AleoOperation, AleoPrivateRecord } from "../types";
import { apiClient } from "../network/api";
import { sdkClient } from "../network/sdk";
import {
  parseMicrocredits,
  patchAccountWithViewKey,
  determineTransactionType,
  generateUniqueUsername,
  patchPublicOperations,
  processRecords,
} from "./utils";

jest.mock("../network/api");
jest.mock("../network/sdk");

const mockGetTransactionById = jest.mocked(apiClient.getTransactionById);
const mockDecryptCiphertext = jest.mocked(sdkClient.decryptCiphertext);

describe("logic utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      const mockAccount = getMockedAccount({
        id: "js:2:aleo:aleo1test:",
        operations: [mockOp1, mockOp2],
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
    });
  });

  describe("determineTransactionType", () => {
    it("should return private for transfer_private regardless of operation type", () => {
      expect(determineTransactionType("transfer_private", "IN")).toBe("private");
      expect(determineTransactionType("transfer_private", "OUT")).toBe("private");
      expect(determineTransactionType("transfer_private", "NONE")).toBe("private");
    });

    it("should return public for transfer_public regardless of operation type", () => {
      expect(determineTransactionType("transfer_public", "IN")).toBe("public");
      expect(determineTransactionType("transfer_public", "OUT")).toBe("public");
      expect(determineTransactionType("transfer_public", "NONE")).toBe("public");
    });

    it("should return private for IN operations ending with to_private", () => {
      expect(determineTransactionType("transfer_public_to_private", "IN")).toBe("private");
    });

    it("should return public for IN operations ending with to_public", () => {
      expect(determineTransactionType("transfer_private_to_public", "IN")).toBe("public");
    });

    it("should return private for OUT operations starting with transfer_private", () => {
      expect(determineTransactionType("transfer_private_to_public", "OUT")).toBe("private");
    });

    it("should return public for OUT operations starting with transfer_public", () => {
      expect(determineTransactionType("transfer_public_to_private", "OUT")).toBe("public");
    });

    it("should return fallback for unrecognized function ids", () => {
      expect(determineTransactionType("unknown_function", "IN")).toBe("public");
      expect(determineTransactionType("unknown_function", "OUT")).toBe("public");
    });

    it("should return fallback for NONE operations with cross-balance transfers", () => {
      expect(determineTransactionType("transfer_public_to_private", "NONE")).toBe("public");
      expect(determineTransactionType("transfer_private_to_public", "NONE")).toBe("public");
    });
  });

  describe("generateUniqueUsername", () => {
    it("should generate a SHA-256 hash from timestamp and address", () => {
      const mockAddress = "aleo1test123";
      const result = generateUniqueUsername(mockAddress);

      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should generate unique hashes for different addresses", () => {
      const address1 = "aleo1address1";
      const address2 = "aleo1address2";

      const result1 = generateUniqueUsername(address1);
      const result2 = generateUniqueUsername(address2);

      expect(result1).toHaveLength(64);
      expect(result2).toHaveLength(64);
      expect(result1).toMatch(/^[a-f0-9]{64}$/);
      expect(result2).toMatch(/^[a-f0-9]{64}$/);
      expect(result1).not.toBe(result2);
    });
  });

  describe("patchPublicOperations", () => {
    const mockCurrency = getMockedCurrency();
    const mockAddress = "aleo1test123";
    const mockLedgerAccountId = "js:2:aleo:aleo1test:";
    const mockViewKey = "AViewKey1mockviewkey";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return unchanged operations when all are fully public", async () => {
      const publicOps: AleoOperation[] = [
        getMockedOperation({
          hash: "tx1",
          extra: { functionId: EXPLORER_TRANSFER_TYPES.PUBLIC, transactionType: "public" },
        }),
        getMockedOperation({
          hash: "tx2",
          extra: { functionId: EXPLORER_TRANSFER_TYPES.PUBLIC, transactionType: "public" },
        }),
      ];

      const result = await patchPublicOperations({
        currency: mockCurrency,
        publicOperations: publicOps,
        privateRecords: [],
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      expect(result).toEqual(publicOps);
      expect(result).toHaveLength(2);
    });

    it("should patch PRIVATE_TO_PUBLIC operation with matching private record (self-transfer)", async () => {
      const publicOp = getMockedOperation({
        hash: "tx123",
        type: "OUT",
        extra: { functionId: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC, transactionType: "public" },
        senders: [mockAddress],
        recipients: ["aleo1other"],
      });

      const privateRecord: AleoPrivateRecord = {
        transaction_id: "tx123",
        sender: mockAddress,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
        block_height: 100,
        block_timestamp: 1704067200,
        commitment: "commit123",
        output_index: 0,
        owner: mockAddress,
        program_name: "credits.aleo",
        record_ciphertext: "cipher123",
        record_name: "record",
        spent: false,
        tag: "tag123",
        transition_id: "transition123",
        transaction_index: 0,
        transition_index: 0,
        status: "Accepted",
      };

      const result = await patchPublicOperations({
        currency: mockCurrency,
        publicOperations: [publicOp],
        privateRecords: [privateRecord],
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      expect(result).toEqual([
        expect.objectContaining({
          type: "OUT",
          senders: [mockAddress],
          recipients: [mockAddress],
          extra: expect.objectContaining({ transactionType: "public" }),
        }),
        expect.objectContaining({
          type: "IN",
          senders: [mockAddress],
          recipients: [mockAddress],
          extra: expect.objectContaining({ transactionType: "private" }),
        }),
      ]);
    });

    it("should patch PUBLIC_TO_PRIVATE operation with matching private record (self-transfer)", async () => {
      const publicOp = getMockedOperation({
        hash: "tx456",
        type: "IN",
        extra: {
          functionId: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
          transactionType: "private",
        },
        senders: ["aleo1other"],
        recipients: [mockAddress],
      });

      const privateRecord: AleoPrivateRecord = {
        transaction_id: "tx456",
        sender: mockAddress,
        function_name: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
        block_height: 200,
        block_timestamp: 1704153600,
        commitment: "commit456",
        output_index: 0,
        owner: mockAddress,
        program_name: "credits.aleo",
        record_ciphertext: "cipher456",
        record_name: "record",
        spent: false,
        tag: "tag456",
        transition_id: "transition456",
        transaction_index: 0,
        transition_index: 0,
        status: "Accepted",
      };

      const result = await patchPublicOperations({
        currency: mockCurrency,
        publicOperations: [publicOp],
        privateRecords: [privateRecord],
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      expect(result).toEqual([
        expect.objectContaining({
          type: "IN",
          senders: [mockAddress],
          recipients: [mockAddress],
          extra: expect.objectContaining({ transactionType: "private" }),
        }),
        expect.objectContaining({
          type: "OUT",
          senders: [mockAddress],
          recipients: [mockAddress],
          extra: expect.objectContaining({ transactionType: "public" }),
        }),
      ]);
    });

    it("should handle PRIVATE_TO_PUBLIC with non-self transfer", async () => {
      const sender = "aleo1sender";
      const publicOp = getMockedOperation({
        hash: "tx789",
        type: "OUT",
        extra: { functionId: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC, transactionType: "public" },
        senders: [sender],
        recipients: [mockAddress],
      });

      const privateRecord: AleoPrivateRecord = {
        transaction_id: "tx789",
        sender: sender,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
        block_height: 300,
        block_timestamp: 1704240000,
        commitment: "commit789",
        output_index: 0,
        owner: sender,
        program_name: "credits.aleo",
        record_ciphertext: "cipher789",
        record_name: "record",
        spent: false,
        tag: "tag789",
        transition_id: "transition789",
        transaction_index: 0,
        transition_index: 0,
        status: "Accepted",
      };

      const result = await patchPublicOperations({
        currency: mockCurrency,
        publicOperations: [publicOp],
        privateRecords: [privateRecord],
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      expect(result).toEqual([
        expect.objectContaining({
          type: "OUT",
          senders: [sender],
          recipients: [mockAddress],
          extra: expect.objectContaining({ transactionType: "public" }),
        }),
      ]);
    });

    it("should decrypt and patch PUBLIC_TO_PRIVATE when record is not available", async () => {
      const recipient = "aleo1recipient";
      const publicOp = getMockedOperation({
        hash: "txABC",
        type: "OUT",
        extra: {
          functionId: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
          transactionType: "private",
        },
        senders: [mockAddress],
        recipients: ["unknown"],
      });

      mockGetTransactionById.mockResolvedValue({
        type: "execute",
        id: "txABC",
        execution: {
          transitions: [
            {
              id: "transition1",
              scm: "scm1",
              tcm: "tcm1",
              tpk: "tpk123",
              inputs: [
                { id: "input0", type: "private", value: "ciphertext_recipient" },
                { id: "input1", type: "public", value: "1000000u64" },
              ],
              outputs: [],
              program: "credits.aleo",
              function: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
            },
          ],
        },
        global_state_root: "sr1",
        proof: "proof1",
        fee: {
          transition: {
            id: "fee1",
            scm: "scm2",
            tcm: "tcm2",
            tpk: "tpk2",
            inputs: [],
            outputs: [],
            program: "credits.aleo",
            function: "fee_public",
          },
        },
        fee_value: 5000,
        block_height: 400,
        block_hash: "block400",
        block_timestamp: "1704326400",
        status: "Accepted",
      });

      mockDecryptCiphertext.mockResolvedValue({
        plaintext: recipient,
      });

      const result = await patchPublicOperations({
        currency: mockCurrency,
        publicOperations: [publicOp],
        privateRecords: [],
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionById).toHaveBeenCalledWith(mockCurrency, "txABC");
      expect(result).toEqual([
        expect.objectContaining({
          type: "OUT",
          senders: [mockAddress],
          recipients: [recipient],
          extra: expect.objectContaining({ transactionType: "private" }),
        }),
      ]);
    });

    it("should ignore fee_private records when matching", async () => {
      const publicOp = getMockedOperation({
        hash: "tx999",
        type: "OUT",
        extra: { functionId: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC, transactionType: "public" },
        senders: [mockAddress],
        recipients: ["aleo1other"],
      });

      const feeRecord: AleoPrivateRecord = {
        transaction_id: "tx999",
        sender: mockAddress,
        function_name: "fee_private",
        block_height: 600,
        block_timestamp: 1704499200,
        commitment: "commit999",
        output_index: 0,
        owner: mockAddress,
        program_name: "credits.aleo",
        record_ciphertext: "cipher999",
        record_name: "record",
        spent: false,
        tag: "tag999",
        transition_id: "transition999",
        transaction_index: 0,
        transition_index: 0,
        status: "Accepted",
      };

      mockGetTransactionById.mockResolvedValue({
        type: "execute",
        id: "tx999",
        execution: {
          transitions: [
            {
              id: "transition1",
              scm: "scm1",
              tcm: "tcm1",
              tpk: "tpk123",
              inputs: [
                { id: "input0", type: "private", value: "record" },
                { id: "input1", type: "private", value: "ciphertext_recipient" },
                { id: "input2", type: "private", value: "ciphertext_amount" },
              ],
              outputs: [],
              program: "credits.aleo",
              function: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
            },
          ],
        },
        global_state_root: "sr1",
        proof: "proof1",
        fee: {
          transition: {
            id: "fee1",
            scm: "scm2",
            tcm: "tcm2",
            tpk: "tpk2",
            inputs: [],
            outputs: [],
            program: "credits.aleo",
            function: "fee_public",
          },
        },
        fee_value: 5000,
        block_height: 600,
        block_hash: "block600",
        block_timestamp: "1704499200",
        status: "Accepted",
      });

      const result = await patchPublicOperations({
        currency: mockCurrency,
        publicOperations: [publicOp],
        privateRecords: [feeRecord],
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      // Should not match with fee_private record, so operation remains unpatched
      expect(result).toHaveLength(1);
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
    });

    it("should handle mixed operations correctly", async () => {
      const fullyPublicOp = getMockedOperation({
        hash: "tx1",
        extra: { functionId: EXPLORER_TRANSFER_TYPES.PUBLIC, transactionType: "public" },
      });

      const semiPublicOp = getMockedOperation({
        hash: "tx2",
        type: "OUT",
        extra: { functionId: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC, transactionType: "public" },
        senders: [mockAddress],
        recipients: ["aleo1other"],
      });

      const privateRecord: AleoPrivateRecord = {
        transaction_id: "tx2",
        sender: mockAddress,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
        block_height: 100,
        block_timestamp: 1704067200,
        commitment: "commit123",
        output_index: 0,
        owner: mockAddress,
        program_name: "credits.aleo",
        record_ciphertext: "cipher123",
        record_name: "record",
        spent: false,
        tag: "tag123",
        transition_id: "transition123",
        transaction_index: 0,
        transition_index: 0,
        status: "Accepted",
      };

      const result = await patchPublicOperations({
        currency: mockCurrency,
        publicOperations: [fullyPublicOp, semiPublicOp],
        privateRecords: [privateRecord],
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      // Fully public op + patched semi-public op + cloned op for self-transfer
      expect(result).toHaveLength(3);
      expect(result.some(op => op.hash === "tx1")).toBe(true);
      expect(result.filter(op => op.hash === "tx2")).toHaveLength(2);
    });
  });

  describe("processRecords", () => {
    it("should merge old and new records without duplicates", () => {
      const oldRecords = [
        getMockedRecord({ transaction_id: "tx1", commitment: "c1", block_height: 100 }),
        getMockedRecord({ transaction_id: "tx2", commitment: "c2", block_height: 99 }),
      ];
      const newRecords = [
        getMockedRecord({ transaction_id: "tx3", commitment: "c3", block_height: 101 }),
        getMockedRecord({ transaction_id: "tx4", commitment: "c4", block_height: 98 }),
      ];
      const unspentRecords = [
        getMockedRecord({ commitment: "c1" }),
        getMockedRecord({ commitment: "c3" }),
      ];

      const result = processRecords(oldRecords, newRecords, unspentRecords);

      expect(result).toHaveLength(4);
      expect(result.map(r => r.commitment)).toEqual(["c3", "c1", "c2", "c4"]);
    });

    it("should deduplicate records based on transaction_id and commitment", () => {
      const oldRecords = [
        getMockedRecord({ transaction_id: "tx1", commitment: "c1", block_height: 100 }),
        getMockedRecord({ transaction_id: "tx2", commitment: "c2", block_height: 99 }),
      ];
      const newRecords = [
        getMockedRecord({ transaction_id: "tx1", commitment: "c1", block_height: 100 }),
        getMockedRecord({ transaction_id: "tx3", commitment: "c3", block_height: 101 }),
      ];
      const unspentRecords: AleoPrivateRecord[] = [];

      const result = processRecords(oldRecords, newRecords, unspentRecords);

      expect(result).toHaveLength(3);
      expect(result.map(r => r.commitment)).toEqual(["c3", "c1", "c2"]);
    });

    it("should mark records as spent or unspent correctly", () => {
      const oldRecords = [
        getMockedRecord({ transaction_id: "tx1", commitment: "c1", block_height: 100 }),
      ];
      const newRecords = [
        getMockedRecord({ transaction_id: "tx2", commitment: "c2", block_height: 101 }),
      ];
      const unspentRecords = [getMockedRecord({ commitment: "c2" })];

      const result = processRecords(oldRecords, newRecords, unspentRecords);

      expect(result).toEqual([
        expect.objectContaining({ commitment: "c2", spent: false }),
        expect.objectContaining({ commitment: "c1", spent: true }),
      ]);
    });

    it("should trim transaction_id and transition_id", () => {
      const oldRecords: AleoPrivateRecord[] = [];
      const newRecords = [
        getMockedRecord({
          transaction_id: "  tx1  ",
          transition_id: "  t1  ",
          commitment: "c1",
          block_height: 100,
        }),
      ];
      const unspentRecords: AleoPrivateRecord[] = [];

      const result = processRecords(oldRecords, newRecords, unspentRecords);

      expect(result).toEqual([
        expect.objectContaining({
          transaction_id: "tx1",
          transition_id: "t1",
          commitment: "c1",
        }),
      ]);
    });

    it("should sort records by block_height descending", () => {
      const oldRecords = [
        getMockedRecord({ transaction_id: "tx1", commitment: "c1", block_height: 100 }),
      ];
      const newRecords = [
        getMockedRecord({ transaction_id: "tx2", commitment: "c2", block_height: 105 }),
        getMockedRecord({ transaction_id: "tx3", commitment: "c3", block_height: 95 }),
        getMockedRecord({ transaction_id: "tx4", commitment: "c4", block_height: 110 }),
      ];
      const unspentRecords: AleoPrivateRecord[] = [];

      const result = processRecords(oldRecords, newRecords, unspentRecords);

      expect(result.map(r => r.block_height)).toEqual([110, 105, 100, 95]);
    });

    it("should handle empty old records", () => {
      const oldRecords: AleoPrivateRecord[] = [];
      const newRecords = [
        getMockedRecord({ transaction_id: "tx1", commitment: "c1", block_height: 100 }),
        getMockedRecord({ transaction_id: "tx2", commitment: "c2", block_height: 99 }),
      ];
      const unspentRecords = [getMockedRecord({ commitment: "c1" })];

      const result = processRecords(oldRecords, newRecords, unspentRecords);

      expect(result).toEqual([
        expect.objectContaining({ commitment: "c1", spent: false, block_height: 100 }),
        expect.objectContaining({ commitment: "c2", spent: true, block_height: 99 }),
      ]);
    });

    it("should handle empty new records", () => {
      const oldRecords = [
        getMockedRecord({ transaction_id: "tx1", commitment: "c1", block_height: 100 }),
        getMockedRecord({ transaction_id: "tx2", commitment: "c2", block_height: 99 }),
      ];
      const newRecords: AleoPrivateRecord[] = [];
      const unspentRecords = [getMockedRecord({ commitment: "c2" })];

      const result = processRecords(oldRecords, newRecords, unspentRecords);

      expect(result).toEqual([
        expect.objectContaining({ commitment: "c1", spent: true, block_height: 100 }),
        expect.objectContaining({ commitment: "c2", spent: false, block_height: 99 }),
      ]);
    });

    it("should handle all empty arrays", () => {
      const result = processRecords([], [], []);

      expect(result).toHaveLength(0);
    });

    it("should handle records with same transaction_id but different commitments", () => {
      const oldRecords = [
        getMockedRecord({ transaction_id: "tx1", commitment: "c1", block_height: 100 }),
      ];
      const newRecords = [
        getMockedRecord({ transaction_id: "tx1", commitment: "c2", block_height: 100 }),
      ];
      const unspentRecords: AleoPrivateRecord[] = [];

      const result = processRecords(oldRecords, newRecords, unspentRecords);

      expect(result).toHaveLength(2);
      expect(result.map(r => r.commitment).sort()).toEqual(["c1", "c2"]);
    });
  });
});
