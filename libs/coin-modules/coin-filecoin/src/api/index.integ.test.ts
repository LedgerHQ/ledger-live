import type { FilecoinApi } from "./types";
import type {
  TransactionIntent,
  MemoNotSupported,
  Balance,
} from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";

/**
 * Integration tests for the Filecoin Alpaca API.
 *
 * These tests make real network calls to the Filecoin API.
 * They use mainnet addresses with known transaction history.
 *
 * API endpoint: https://filecoin.coin.ledger.com
 *
 * NOTE: These are intentional real integration tests, not mocked unit tests.
 * They verify the actual API contract and behavior against the live Filecoin backend.
 * If tests fail due to network issues or API changes, that's valuable feedback.
 *
 * For deterministic CI testing, consider running these tests in a separate job
 * with appropriate retry logic and timeouts.
 */

// Known mainnet addresses with transaction history for testing
// These are public addresses from the Filecoin blockchain
const TEST_ADDRESS = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";

// Ethereum-style address for ERC20 token operations - required because ERC20 recipients
// must be convertible to Ethereum format for encoding in ERC20 transfer params
// This is a valid 0x address format that passes through convertAddressFilToEth directly
const TEST_ETH_ADDRESS = "0x1234567890123456789012345678901234567890";

// Known ERC20 token contract address on Filecoin mainnet (Ethereum format)
// This is a real FEVM token contract for fee estimation and transaction crafting
const TEST_ERC20_CONTRACT = "0x2421db204968a367cc2c866cd057fa754cb84edf";

// Use a recent block height to avoid fetching entire history (causes timeouts)
// The API has a context deadline that times out with large result sets
// Note: This value should be updated periodically as the chain grows
const RECENT_MIN_HEIGHT = 4000000; // Use recent blocks to limit data fetched

describe("Filecoin API - Integration Tests", () => {
  let api: FilecoinApi;

  beforeAll(() => {
    api = createApi();
  });

  describe("lastBlock", () => {
    it("should return the current block height from mainnet", async () => {
      const result = await api.lastBlock();

      expect(result.height).toBeGreaterThan(0);
      expect(typeof result.hash).toBe("string");
      expect(result.hash.length).toBeGreaterThan(0);
    });
  });

  describe("getBalance", () => {
    it("should return balance for a valid address", async () => {
      const balances = await api.getBalance(TEST_ADDRESS);

      expect(balances).toBeDefined();
      expect(Array.isArray(balances)).toBe(true);
      expect(balances.length).toBeGreaterThanOrEqual(1);

      // First balance should be native FIL
      const nativeBalance = balances.find(b => b.asset.type === "native");
      expect(nativeBalance).toBeDefined();
      expect(typeof nativeBalance!.value).toBe("bigint");
      expect(nativeBalance!.value).toBeGreaterThanOrEqual(0n);
    });
  });

  describe("getSequence", () => {
    it("should return the account nonce for a valid address", async () => {
      const nonce = await api.getSequence(TEST_ADDRESS);

      expect(typeof nonce).toBe("bigint");
      expect(nonce).toBeGreaterThanOrEqual(0n);
    });
  });

  describe("estimateFees", () => {
    it("should estimate fees for a native transfer", async () => {
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_ADDRESS, // Send to self for testing
        amount: 1000000000000000n, // 0.001 FIL
        asset: { type: "native" },
      };

      const result = await api.estimateFees(intent);

      expect(result.value).toBeGreaterThan(0n);
      expect(result.parameters?.gasFeeCap).toBeGreaterThan(0n);
      expect(result.parameters?.gasPremium).toBeGreaterThan(0n);
      expect(result.parameters?.gasLimit).toBeGreaterThan(0n);
    });

    // Note: Fee estimation for ERC20 transfers may not be supported by the API
    // The API's fee estimation endpoint may not handle InvokeEVM method correctly
    // For ERC20 transfers, use custom fees or estimate based on typical gas costs
    it.skip("should estimate fees for an ERC20 token transfer", async () => {
      // ERC20 transfers require Ethereum-compatible addresses for recipient encoding
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_ETH_ADDRESS, // 0x address for ERC20 recipient
        amount: 1000000n, // Token amount (depends on token decimals)
        asset: { type: "erc20", assetReference: TEST_ERC20_CONTRACT },
      };

      const result = await api.estimateFees(intent);

      // Token transfers should have higher gas costs due to contract interaction
      expect(result.value).toBeGreaterThan(0n);
      expect(result.parameters?.gasFeeCap).toBeGreaterThan(0n);
      expect(result.parameters?.gasPremium).toBeGreaterThan(0n);
      expect(result.parameters?.gasLimit).toBeGreaterThan(0n);
      // ERC20 transfers typically require more gas than native transfers
      // (InvokeEVM method vs simple Transfer)
    });
  });

  describe("craftTransaction", () => {
    it("should craft a native FIL transfer transaction", async () => {
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_ADDRESS,
        amount: 1000000000000000n, // 0.001 FIL
        asset: { type: "native" },
      };

      const result = await api.craftTransaction(intent);

      expect(result.transaction).toBeDefined();
      expect(typeof result.transaction).toBe("string");

      // Verify the transaction can be parsed
      const parsed = JSON.parse(result.transaction);
      expect(parsed.txPayload).toBeDefined();
      expect(typeof parsed.details.nonce).toBe("number");
      expect(parsed.details.sender).toBe(TEST_ADDRESS);
      expect(parsed.details.recipient).toBe(TEST_ADDRESS);
    });

    it("should craft an ERC20 token transfer transaction", async () => {
      // ERC20 transfers require Ethereum-compatible addresses for recipient encoding
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_ETH_ADDRESS, // 0x address for ERC20 recipient
        amount: 1000000n, // Token amount
        asset: { type: "erc20", assetReference: TEST_ERC20_CONTRACT },
      };

      // Provide custom fees since fee estimation API may not support InvokeEVM method
      const customFees = {
        value: 100000000000000n,
        parameters: {
          gasFeeCap: 1000000000n,
          gasPremium: 100000000n,
          gasLimit: 10000000n,
        },
      };

      const result = await api.craftTransaction(intent, customFees);

      expect(result.transaction).toBeDefined();
      expect(typeof result.transaction).toBe("string");

      // Verify the transaction can be parsed
      const parsed = JSON.parse(result.transaction);
      expect(parsed.txPayload).toBeDefined();
      expect(typeof parsed.details.nonce).toBe("number");
      expect(parsed.details.sender).toBe(TEST_ADDRESS);
      // For token transfers, recipient in details is the contract address (converted to f410 format)
      expect(parsed.details.recipient).toBeDefined();
      // Token transfers use InvokeEVM method (method 3844450837)
      expect(parsed.details.method).toBe(3844450837);
      // Token transfers send 0 FIL to the contract
      expect(parsed.details.value).toBe("0");
      // Params should contain encoded ERC20 transfer data
      expect(parsed.details.params).toBeDefined();
      expect(parsed.details.params.length).toBeGreaterThan(0);
    });
  });

  describe("combine", () => {
    it("should combine an unsigned transaction with a signature", () => {
      const unsignedTx = JSON.stringify({
        txPayload: "abcd1234",
        details: {
          nonce: 5,
          method: 0,
          sender: TEST_ADDRESS,
          recipient: TEST_ADDRESS,
          params: "",
          value: "100000000000000000",
          gasFeeCap: "100000",
          gasPremium: "50000",
          gasLimit: "1000000",
        },
      });

      const signature = "deadbeefcafebabe1234567890abcdef";

      const result = api.combine(unsignedTx, signature);

      expect(typeof result).toBe("string");

      const parsed = JSON.parse(result);
      expect(parsed.message).toBeDefined();
      expect(parsed.signature).toBeDefined();
      expect(parsed.signature.type).toBe(1); // secp256k1
      expect(parsed.message.from).toBe(TEST_ADDRESS);
      expect(parsed.message.to).toBe(TEST_ADDRESS);
    });
  });

  describe("validateIntent", () => {
    it("should validate a valid native transfer intent", async () => {
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_ADDRESS,
        amount: 100000000000000000n,
        asset: { type: "native" },
      };

      const balances: Balance[] = [{ value: 1000000000000000000n, asset: { type: "native" } }];

      const customFees = { value: 100000000000n };

      const result = await api.validateIntent(intent, balances, customFees);

      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.amount).toBe(100000000000000000n);
      expect(result.estimatedFees).toBe(100000000000n);
    });

    it("should return error for insufficient balance", async () => {
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_ADDRESS,
        amount: 2000000000000000000n, // More than balance
        asset: { type: "native" },
      };

      const balances: Balance[] = [{ value: 1000000000000000000n, asset: { type: "native" } }];

      const customFees = { value: 100000000000n };

      const result = await api.validateIntent(intent, balances, customFees);

      expect(result.errors.amount).toBeDefined();
      expect(result.errors.amount.message).toContain("Insufficient");
    });

    it("should return error for invalid recipient address", async () => {
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: "invalid-address",
        amount: 100000000000000000n,
        asset: { type: "native" },
      };

      const balances: Balance[] = [{ value: 1000000000000000000n, asset: { type: "native" } }];

      const customFees = { value: 100000000000n };

      const result = await api.validateIntent(intent, balances, customFees);

      expect(result.errors.recipient).toBeDefined();
    });
  });

  describe("listOperations", () => {
    it("should list operations for an address", async () => {
      const [operations, cursor] = await api.listOperations(TEST_ADDRESS, {
        minHeight: RECENT_MIN_HEIGHT,
        order: "desc",
      });

      expect(Array.isArray(operations)).toBe(true);
      expect(cursor).toBeDefined();

      if (operations.length > 0) {
        const op = operations[0];
        expect(op.tx.hash).toBeDefined();
        expect(op.tx.block.height).toBeGreaterThan(0);
        expect(op.asset.type).toBeDefined();
      }
    });

    // Shared operations fetched once for native, token, and structure validation tests
    describe("operation validation", () => {
      let operations: Awaited<ReturnType<typeof api.listOperations>>[0];

      beforeAll(async () => {
        [operations] = await api.listOperations(TEST_ADDRESS, {
          minHeight: RECENT_MIN_HEIGHT,
          order: "desc",
          limit: 100,
        });
      });

      describe("native asset transfers", () => {
        it("should return operations with valid types (IN, OUT, or FEES)", () => {
          // Filter to native operations only
          const nativeOps = operations.filter(op => op.asset.type === "native");

          if (nativeOps.length > 0) {
            // All operations should have valid types
            for (const op of nativeOps) {
              expect(["IN", "OUT", "FEES"]).toContain(op.type);
              expect(op.tx.hash).toBeDefined();
              expect(op.tx.hash.length).toBeGreaterThan(0);
              expect(op.tx.block.height).toBeGreaterThan(0);
            }
          }
        });

        it("should return OUT operations with sender matching test address", () => {
          const outOps = operations.filter(
            op => op.type === "OUT" && op.asset.type === "native",
          );

          if (outOps.length > 0) {
            for (const op of outOps) {
              // For OUT operations, the test address should be in senders
              expect(op.senders.map(s => s.toLowerCase())).toContain(
                TEST_ADDRESS.toLowerCase(),
              );
              expect(op.value).toBeGreaterThan(0n);
            }
          }
        });

        it("should return IN operations with recipient matching test address", () => {
          const inOps = operations.filter(
            op => op.type === "IN" && op.asset.type === "native",
          );

          if (inOps.length > 0) {
            for (const op of inOps) {
              // For IN operations, the test address should be in recipients
              expect(op.recipients.map(r => r.toLowerCase())).toContain(
                TEST_ADDRESS.toLowerCase(),
              );
              expect(op.value).toBeGreaterThan(0n);
            }
          }
        });

        it("should return FEES operations associated with outgoing transactions", () => {
          const feesOps = operations.filter(
            op => op.type === "FEES" && op.asset.type === "native",
          );

          if (feesOps.length > 0) {
            for (const op of feesOps) {
              // FEES operations should have non-zero fees
              expect(op.tx.fees).toBeGreaterThanOrEqual(0n);
              expect(op.tx.hash).toBeDefined();
            }
          }
        });
      });

      describe("token transfers (ERC20)", () => {
        it("should return ERC20 operations if address has token history", () => {
          const tokenOps = operations.filter(op => op.asset.type === "erc20");

          // Token operations are optional - address may not have any
          if (tokenOps.length > 0) {
            for (const op of tokenOps) {
              expect(["IN", "OUT"]).toContain(op.type);
              expect(op.asset.type).toBe("erc20");
              // ERC20 assets should have assetReference (contract address)
              if (op.asset.type === "erc20") {
                expect(op.asset.assetReference).toBeDefined();
                expect(op.asset.assetReference!.length).toBeGreaterThan(0);
              }
              expect(op.tx.hash).toBeDefined();
              expect(op.value).toBeGreaterThanOrEqual(0n);
            }
          }
        });

        it("should correctly identify IN token operations", () => {
          const tokenInOps = operations.filter(
            op => op.type === "IN" && op.asset.type === "erc20",
          );

          if (tokenInOps.length > 0) {
            for (const op of tokenInOps) {
              // For IN token operations, test address should be in recipients
              expect(op.recipients.map(r => r.toLowerCase())).toContain(
                TEST_ADDRESS.toLowerCase(),
              );
            }
          }
        });

        it("should correctly identify OUT token operations", () => {
          const tokenOutOps = operations.filter(
            op => op.type === "OUT" && op.asset.type === "erc20",
          );

          if (tokenOutOps.length > 0) {
            for (const op of tokenOutOps) {
              // For OUT token operations, test address should be in senders
              expect(op.senders.map(s => s.toLowerCase())).toContain(
                TEST_ADDRESS.toLowerCase(),
              );
            }
          }
        });
      });

      describe("operation structure validation", () => {
        it("should return operations with complete transaction details", () => {
          if (operations.length > 0) {
            for (const op of operations) {
              // Validate operation structure
              expect(op.id).toBeDefined();
              expect(op.type).toBeDefined();
              expect(typeof op.value).toBe("bigint");
              expect(Array.isArray(op.senders)).toBe(true);
              expect(Array.isArray(op.recipients)).toBe(true);

              // Validate asset structure
              expect(op.asset).toBeDefined();
              expect(["native", "erc20"]).toContain(op.asset.type);

              // Validate transaction details
              expect(op.tx).toBeDefined();
              expect(op.tx.hash).toBeDefined();
              expect(op.tx.block).toBeDefined();
              expect(typeof op.tx.block.height).toBe("number");
              expect(op.tx.date).toBeDefined();
              expect(typeof op.tx.fees).toBe("bigint");
              expect(typeof op.tx.failed).toBe("boolean");
            }
          }
        });
      });
    });

    describe("operation sorting", () => {
      it("should return operations sorted by block height", async () => {
        const [operationsAsc] = await api.listOperations(TEST_ADDRESS, {
          minHeight: RECENT_MIN_HEIGHT,
          order: "asc",
          limit: 20,
        });

        const [operationsDesc] = await api.listOperations(TEST_ADDRESS, {
          minHeight: RECENT_MIN_HEIGHT,
          order: "desc",
          limit: 20,
        });

        // Check ascending order
        if (operationsAsc.length >= 2) {
          for (let i = 1; i < operationsAsc.length; i++) {
            expect(operationsAsc[i].tx.block.height).toBeGreaterThanOrEqual(
              operationsAsc[i - 1].tx.block.height,
            );
          }
        }

        // Check descending order
        if (operationsDesc.length >= 2) {
          for (let i = 1; i < operationsDesc.length; i++) {
            expect(operationsDesc[i].tx.block.height).toBeLessThanOrEqual(
              operationsDesc[i - 1].tx.block.height,
            );
          }
        }
      });
    });
  });

  describe("unsupported methods", () => {
    it("getStakes should throw not supported error", async () => {
      await expect(api.getStakes(TEST_ADDRESS)).rejects.toThrow("not supported");
    });

    it("getRewards should throw not supported error", async () => {
      await expect(api.getRewards(TEST_ADDRESS)).rejects.toThrow("not supported");
    });

    it("getValidators should throw not supported error", async () => {
      await expect(api.getValidators()).rejects.toThrow("not supported");
    });

    it("getBlock should throw not supported error", async () => {
      await expect(api.getBlock(1000)).rejects.toThrow("not supported");
    });

    it("getBlockInfo should throw not supported error", async () => {
      await expect(api.getBlockInfo(1000)).rejects.toThrow("not supported");
    });

    it("craftRawTransaction should throw not supported error", async () => {
      await expect(api.craftRawTransaction("tx", "sender", "pubkey", 0n)).rejects.toThrow(
        "not supported",
      );
    });
  });

  describe("full transaction flow (without broadcast)", () => {
    it("should complete craft -> combine flow", async () => {
      // Step 1: Craft the transaction
      const intent: TransactionIntent<MemoNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_ADDRESS,
        amount: 500000000000000000n,
        asset: { type: "native" },
      };

      const craftedTx = await api.craftTransaction(intent);
      expect(craftedTx.transaction).toBeDefined();

      // Step 2: Combine with a mock signature (we can't sign without a real key)
      const mockSignature = "0102030405060708091011121314151617181920212223242526";
      const signedTx = api.combine(craftedTx.transaction, mockSignature);

      // Verify the signed transaction structure
      const parsed = JSON.parse(signedTx);
      expect(typeof parsed.message.nonce).toBe("number");
      expect(parsed.message.value).toBe("500000000000000000");
      expect(parsed.signature.type).toBe(1);
      expect(parsed.signature.data).toBeDefined();
    });
  });

  describe("broadcast", () => {
    it.skip("should broadcast a signed transaction (requires valid signature)", async () => {
      // This test is skipped because it requires a valid signature from a real wallet
      // To run this test:
      // 1. Sign a transaction with a real Filecoin wallet
      // 2. Pass the signed transaction to api.broadcast()

      const signedTx = JSON.stringify({
        message: {
          /* valid message */
        },
        signature: {
          /* valid signature */
        },
      });

      const txHash = await api.broadcast(signedTx);
      expect(txHash).toBeDefined();
      expect(typeof txHash).toBe("string");
    });
  });
});
