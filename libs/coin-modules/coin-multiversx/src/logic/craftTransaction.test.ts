import { craftTransaction } from "./craftTransaction";
import {
  CHAIN_ID,
  GAS,
  GAS_PRICE,
  MIN_GAS_LIMIT,
  TRANSACTION_OPTIONS_TX_HASH_SIGN,
  TRANSACTION_VERSION_DEFAULT,
} from "../constants";
import type { CraftTransactionInput, MultiversXTransactionMode } from "../types";

describe("craftTransaction", () => {
  const mockInput: CraftTransactionInput = {
    sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    recipient: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
    amount: 1000000000000000000n, // 1 EGLD
    nonce: 42,
    mode: "send",
  };

  describe("basic transaction crafting", () => {
    it("crafts a basic native EGLD transfer transaction", () => {
      const result = craftTransaction(mockInput);

      expect(result).toHaveProperty("transaction");
      expect(typeof result.transaction).toBe("string");
    });

    it("creates transaction with correct structure", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed).toEqual({
        nonce: 42,
        value: "1000000000000000000",
        receiver: mockInput.recipient,
        sender: mockInput.sender,
        gasPrice: GAS_PRICE,
        gasLimit: MIN_GAS_LIMIT,
        chainID: CHAIN_ID,
        version: TRANSACTION_VERSION_DEFAULT,
        options: TRANSACTION_OPTIONS_TX_HASH_SIGN,
      });
    });

    it("produces valid JSON that can be parsed", () => {
      const result = craftTransaction(mockInput);

      expect(() => JSON.parse(result.transaction)).not.toThrow();
    });
  });

  describe("gas limit handling", () => {
    it("uses default gas limit when not provided", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.gasLimit).toBe(MIN_GAS_LIMIT);
    });

    it("uses custom gas limit when provided", () => {
      const inputWithGas = { ...mockInput, gasLimit: 75000 };
      const result = craftTransaction(inputWithGas);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.gasLimit).toBe(75000);
    });
  });

  describe("amount handling", () => {
    it("converts amount bigint to string", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.value).toBe("1000000000000000000");
      expect(typeof parsed.value).toBe("string");
    });

    it("handles zero amount", () => {
      const inputZero = { ...mockInput, amount: 0n };
      const result = craftTransaction(inputZero);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.value).toBe("0");
    });

    it("handles large amount", () => {
      const inputLarge = { ...mockInput, amount: 999999999999999999999999n };
      const result = craftTransaction(inputLarge);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.value).toBe("999999999999999999999999");
    });
  });

  describe("transaction fields", () => {
    it("does not include data field for native EGLD transfers", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed).not.toHaveProperty("data");
    });

    it("does not include signature field in unsigned transaction", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed).not.toHaveProperty("signature");
    });

    it("sets correct gas price constant", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.gasPrice).toBe(GAS_PRICE);
      expect(parsed.gasPrice).toBe(1000000000);
    });

    it("sets correct chain ID for mainnet", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.chainID).toBe(CHAIN_ID);
      expect(parsed.chainID).toBe("1");
    });

    it("sets correct transaction version", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.version).toBe(TRANSACTION_VERSION_DEFAULT);
      expect(parsed.version).toBe(2);
    });

    it("sets correct transaction options", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.options).toBe(TRANSACTION_OPTIONS_TX_HASH_SIGN);
      expect(parsed.options).toBe(0b0001);
    });

    it("correctly sets nonce from input", () => {
      const inputDifferentNonce = { ...mockInput, nonce: 123 };
      const result = craftTransaction(inputDifferentNonce);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.nonce).toBe(123);
    });

    it("handles nonce of zero", () => {
      const inputZeroNonce = { ...mockInput, nonce: 0 };
      const result = craftTransaction(inputZeroNonce);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.nonce).toBe(0);
    });

    it("correctly sets sender from input", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.sender).toBe(mockInput.sender);
    });

    it("correctly sets receiver from input", () => {
      const result = craftTransaction(mockInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.receiver).toBe(mockInput.recipient);
    });
  });

  describe("input validation (ADR-003)", () => {
    it("throws error for invalid sender address format", () => {
      const invalidInput = { ...mockInput, sender: "invalid-address" };

      expect(() => craftTransaction(invalidInput)).toThrow(
        "craftTransaction failed: invalid sender address format",
      );
    });

    it("throws error for sender address without erd1 prefix", () => {
      const invalidInput = {
        ...mockInput,
        sender: "abc1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      };

      expect(() => craftTransaction(invalidInput)).toThrow(
        "craftTransaction failed: invalid sender address format",
      );
    });

    it("throws error for sender address with wrong length", () => {
      const invalidInput = { ...mockInput, sender: "erd1short" };

      expect(() => craftTransaction(invalidInput)).toThrow(
        "craftTransaction failed: invalid sender address format",
      );
    });

    it("throws error for invalid recipient address format", () => {
      const invalidInput = { ...mockInput, recipient: "invalid-address" };

      expect(() => craftTransaction(invalidInput)).toThrow(
        "craftTransaction failed: invalid recipient address format",
      );
    });

    it("throws error for recipient address without erd1 prefix", () => {
      const invalidInput = {
        ...mockInput,
        recipient: "abc1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
      };

      expect(() => craftTransaction(invalidInput)).toThrow(
        "craftTransaction failed: invalid recipient address format",
      );
    });

    it("throws error for negative amount", () => {
      const invalidInput = { ...mockInput, amount: -1n };

      expect(() => craftTransaction(invalidInput)).toThrow(
        "craftTransaction failed: amount cannot be negative",
      );
    });

    it("throws error for negative nonce", () => {
      const invalidInput = { ...mockInput, nonce: -1 };

      expect(() => craftTransaction(invalidInput)).toThrow(
        "craftTransaction failed: nonce cannot be negative",
      );
    });

    // Note: delegation modes (delegate, unDelegate, etc.) are now supported
    // and tested in the "delegation modes" describe block below

    it("throws error for empty string sender", () => {
      const invalidInput = { ...mockInput, sender: "" };

      expect(() => craftTransaction(invalidInput)).toThrow(
        "craftTransaction failed: invalid sender address format",
      );
    });

    it("throws error for empty string recipient", () => {
      const invalidInput = { ...mockInput, recipient: "" };

      expect(() => craftTransaction(invalidInput)).toThrow(
        "craftTransaction failed: invalid recipient address format",
      );
    });
  });

  describe("ESDT token transfers", () => {
    const esdtInput: CraftTransactionInput = {
      sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      recipient: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
      amount: 100000000n, // 100 USDC with 6 decimals
      nonce: 42,
      mode: "send",
      tokenIdentifier: "USDC-abc123",
    };

    it("crafts ESDT token transfer with valid identifier", () => {
      const result = craftTransaction(esdtInput);

      expect(result).toHaveProperty("transaction");
      expect(typeof result.transaction).toBe("string");
    });

    it("sets value to '0' for ESDT transfers", () => {
      const result = craftTransaction(esdtInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.value).toBe("0");
    });

    it("includes data field with ESDT transfer encoding", () => {
      const result = craftTransaction(esdtInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed).toHaveProperty("data");
      expect(typeof parsed.data).toBe("string");
    });

    it("encodes ESDT transfer data in correct format", () => {
      const result = craftTransaction(esdtInput);
      const parsed = JSON.parse(result.transaction);

      // Decode the base64 data
      const decodedData = Buffer.from(parsed.data, "base64").toString();

      // Should start with "ESDTTransfer@"
      expect(decodedData).toMatch(/^ESDTTransfer@/);

      // Should contain token identifier in hex
      const tokenHex = Buffer.from("USDC-abc123").toString("hex");
      expect(decodedData).toContain(tokenHex);
    });

    it("encodes amount with even-length hex padding", () => {
      // Amount that produces odd-length hex: 15 -> "f" (odd)
      const oddAmountInput = { ...esdtInput, amount: 15n };
      const result = craftTransaction(oddAmountInput);
      const parsed = JSON.parse(result.transaction);
      const decodedData = Buffer.from(parsed.data, "base64").toString();

      // Split by @ and get the amount part (last segment)
      const parts = decodedData.split("@");
      const amountHex = parts[parts.length - 1];

      // Amount hex must have even length
      expect(amountHex.length % 2).toBe(0);
      // "f" padded should be "0f"
      expect(amountHex).toBe("0f");
    });

    it("does not pad already even-length hex amounts", () => {
      // Amount that produces even-length hex: 255 -> "ff" (even)
      const evenAmountInput = { ...esdtInput, amount: 255n };
      const result = craftTransaction(evenAmountInput);
      const parsed = JSON.parse(result.transaction);
      const decodedData = Buffer.from(parsed.data, "base64").toString();

      const parts = decodedData.split("@");
      const amountHex = parts[parts.length - 1];

      expect(amountHex.length % 2).toBe(0);
      expect(amountHex).toBe("ff");
    });

    it("uses ESDT_TRANSFER gas limit for ESDT transfers", () => {
      const result = craftTransaction(esdtInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.gasLimit).toBe(GAS.ESDT_TRANSFER);
    });

    it("allows custom gas limit override for ESDT transfers", () => {
      const inputWithGas = { ...esdtInput, gasLimit: 750000 };
      const result = craftTransaction(inputWithGas);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.gasLimit).toBe(750000);
    });

    it("crafts transaction with non-existent token identifier (validation is on-chain)", () => {
      // Per AC#4: Invalid/non-existent tokens should still be crafted
      const invalidTokenInput = {
        ...esdtInput,
        tokenIdentifier: "INVALID-xxxxxx",
      };

      const result = craftTransaction(invalidTokenInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed).toHaveProperty("data");
      // Token identifier should be in the data
      const decodedData = Buffer.from(parsed.data, "base64").toString();
      const tokenHex = Buffer.from("INVALID-xxxxxx").toString("hex");
      expect(decodedData).toContain(tokenHex);
    });

    it("treats empty string tokenIdentifier as native EGLD transfer", () => {
      // When tokenIdentifier is empty, implementation treats it as native EGLD transfer
      // Per design: tokenIdentifier determines ESDT vs native, not a validation error
      const emptyTokenInput = {
        ...esdtInput,
        tokenIdentifier: "",
      };

      const result = craftTransaction(emptyTokenInput);
      const parsed = JSON.parse(result.transaction);

      // Should be treated as native transfer (no data field, value = amount)
      expect(parsed.value).toBe(esdtInput.amount.toString());
      expect(parsed).not.toHaveProperty("data");
    });

    it("treats undefined tokenIdentifier as native EGLD transfer", () => {
      // When tokenIdentifier is undefined, implementation treats it as native EGLD transfer
      // Per design: tokenIdentifier determines ESDT vs native, not a validation error
      const noTokenInput = {
        ...esdtInput,
        tokenIdentifier: undefined,
      };

      const result = craftTransaction(noTokenInput);
      const parsed = JSON.parse(result.transaction);

      // Should be treated as native transfer (no data field, value = amount)
      expect(parsed.value).toBe(esdtInput.amount.toString());
      expect(parsed).not.toHaveProperty("data");
    });

    it("correctly encodes full ESDT transfer data string", () => {
      // Test with known values using valid addresses
      const knownInput: CraftTransactionInput = {
        sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        recipient: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
        amount: 100000000n, // 0x5f5e100
        nonce: 1,
        mode: "send",
        tokenIdentifier: "TOKEN-abc123",
      };

      const result = craftTransaction(knownInput);
      const parsed = JSON.parse(result.transaction);
      const decodedData = Buffer.from(parsed.data, "base64").toString();

      // Expected format: ESDTTransfer@{tokenHex}@{amountHex}
      const expectedTokenHex = Buffer.from("TOKEN-abc123").toString("hex");
      const expectedAmountHex = "05f5e100"; // 100000000 in hex, padded to even length

      expect(decodedData).toBe(`ESDTTransfer@${expectedTokenHex}@${expectedAmountHex}`);
    });

    it("handles large ESDT amounts", () => {
      const largeAmountInput = {
        ...esdtInput,
        amount: 999999999999999999999999n,
      };
      const result = craftTransaction(largeAmountInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.value).toBe("0");
      expect(parsed).toHaveProperty("data");
    });

    it("handles zero ESDT amount", () => {
      const zeroAmountInput = { ...esdtInput, amount: 0n };
      const result = craftTransaction(zeroAmountInput);
      const parsed = JSON.parse(result.transaction);
      const decodedData = Buffer.from(parsed.data, "base64").toString();

      const parts = decodedData.split("@");
      const amountHex = parts[parts.length - 1];

      // Zero should be "00" (padded to even length)
      expect(amountHex).toBe("00");
    });

    it("maintains correct transaction structure for ESDT", () => {
      const result = craftTransaction(esdtInput);
      const parsed = JSON.parse(result.transaction);

      expect(parsed).toEqual({
        nonce: 42,
        value: "0",
        receiver: esdtInput.recipient,
        sender: esdtInput.sender,
        gasPrice: GAS_PRICE,
        gasLimit: GAS.ESDT_TRANSFER,
        chainID: CHAIN_ID,
        version: TRANSACTION_VERSION_DEFAULT,
        options: TRANSACTION_OPTIONS_TX_HASH_SIGN,
        data: expect.any(String),
      });
    });
  });

  // Story 4.3: Delegation mode tests
  describe("delegation modes", () => {
    // Validator contract address (used as recipient for delegation transactions)
    const validatorContract = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy";

    const mockDelegationInput: CraftTransactionInput = {
      sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      recipient: validatorContract,
      amount: 10000000000000000000n, // 10 EGLD
      nonce: 42,
      mode: "delegate",
    };

    describe("delegate mode", () => {
      it("creates transaction with delegate data encoding (AC: #1)", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "delegate" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        // Data should be base64 encoded "delegate"
        expect(parsed.data).toBe(Buffer.from("delegate").toString("base64"));
      });

      it("sets value to amount for delegate (staked amount is the value)", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "delegate" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.value).toBe("10000000000000000000");
      });

      it("uses GAS.DELEGATE gas limit for delegate mode (AC: #6)", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "delegate" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(GAS.DELEGATE);
      });

      it("sets receiver to validator contract address (AC: #7)", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "delegate" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.receiver).toBe(validatorContract);
      });

      it("allows custom gas limit override", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "delegate",
          gasLimit: 100000000,
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(100000000);
      });
    });

    describe("unDelegate mode", () => {
      it("creates transaction with unDelegate data encoding and value=0 (AC: #2)", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "unDelegate",
          amount: 5000000000000000000n, // 5 EGLD to undelegate
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        // Value should be "0" (amount encoded in data field)
        expect(parsed.value).toBe("0");
        // Data should be base64 format
        expect(parsed.data).toMatch(/^[A-Za-z0-9+/]+=*$/);
      });

      it("encodes amount in hex within data field (AC: #2)", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "unDelegate",
          amount: 10000000000000000000n, // 10 EGLD = 0x8ac7230489e80000
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        const decoded = Buffer.from(parsed.data, "base64").toString();
        // Should be "unDelegate@{hex amount}"
        expect(decoded).toMatch(/^unDelegate@[0-9a-fA-F]+$/);
      });

      it("uses even-length hex for amount (255 = ff)", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "unDelegate",
          amount: 255n,
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        const decoded = Buffer.from(parsed.data, "base64").toString();
        expect(decoded).toBe("unDelegate@ff");
      });

      it("prepends 0 for odd-length hex amount (15 = f -> 0f) (Subtask 1.6)", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "unDelegate",
          amount: 15n, // 0xf (odd length)
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        const decoded = Buffer.from(parsed.data, "base64").toString();
        expect(decoded).toBe("unDelegate@0f");
      });

      it("prepends 0 for large odd-length hex amount (4095 = fff -> 0fff)", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "unDelegate",
          amount: 4095n, // 0xfff (odd length)
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        const decoded = Buffer.from(parsed.data, "base64").toString();
        expect(decoded).toBe("unDelegate@0fff");
      });

      it("uses GAS.DELEGATE gas limit for unDelegate mode (AC: #6)", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "unDelegate" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(GAS.DELEGATE);
      });

      it("handles zero amount for unDelegate (produces unDelegate@00)", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "unDelegate",
          amount: 0n,
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.value).toBe("0");
        const decoded = Buffer.from(parsed.data, "base64").toString();
        expect(decoded).toBe("unDelegate@00");
      });

      it("handles very large amount for unDelegate", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "unDelegate",
          amount: 999999999999999999999999n, // Very large amount
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.value).toBe("0");
        const decoded = Buffer.from(parsed.data, "base64").toString();
        expect(decoded).toMatch(/^unDelegate@[0-9a-f]+$/);
        // Verify hex length is even
        const amountHex = decoded.split("@")[1];
        expect(amountHex.length % 2).toBe(0);
      });
    });

    describe("withdraw mode", () => {
      it("creates transaction with withdraw data encoding and value=0 (AC: #3)", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "withdraw",
          amount: 0n, // Amount not used for withdraw
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.data).toBe(Buffer.from("withdraw").toString("base64"));
        expect(parsed.value).toBe("0");
      });

      it("uses GAS.CLAIM gas limit for withdraw mode (AC: #6)", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "withdraw" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(GAS.CLAIM);
      });
    });

    describe("claimRewards mode", () => {
      it("creates transaction with claimRewards data encoding and value=0 (AC: #4)", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "claimRewards",
          amount: 0n,
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.data).toBe(Buffer.from("claimRewards").toString("base64"));
        expect(parsed.value).toBe("0");
      });

      it("uses GAS.CLAIM gas limit for claimRewards mode (AC: #6)", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "claimRewards" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(GAS.CLAIM);
      });
    });

    describe("reDelegateRewards mode", () => {
      it("creates transaction with reDelegateRewards data encoding and value=0 (AC: #5)", () => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode: "reDelegateRewards",
          amount: 0n,
        };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.data).toBe(Buffer.from("reDelegateRewards").toString("base64"));
        expect(parsed.value).toBe("0");
      });

      it("uses GAS.CLAIM gas limit for reDelegateRewards mode (AC: #6)", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "reDelegateRewards" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(GAS.CLAIM);
      });
    });

    describe("common delegation behavior", () => {
      const delegationModes: MultiversXTransactionMode[] = [
        "delegate",
        "unDelegate",
        "withdraw",
        "claimRewards",
        "reDelegateRewards",
      ];

      it.each(delegationModes)("%s mode maintains correct transaction structure", mode => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        // All delegation transactions should have standard fields
        expect(parsed.nonce).toBe(42);
        expect(parsed.receiver).toBe(validatorContract);
        expect(parsed.sender).toBe(mockDelegationInput.sender);
        expect(parsed.gasPrice).toBe(GAS_PRICE);
        expect(parsed.chainID).toBe(CHAIN_ID);
        expect(parsed.version).toBe(TRANSACTION_VERSION_DEFAULT);
        expect(parsed.options).toBe(TRANSACTION_OPTIONS_TX_HASH_SIGN);
        expect(parsed.data).toBeDefined();
      });

      it.each(delegationModes)("%s mode validates sender address", mode => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode,
          sender: "invalid-address",
        };

        expect(() => craftTransaction(input)).toThrow(
          "craftTransaction failed: invalid sender address format",
        );
      });

      it.each(delegationModes)("%s mode validates recipient address", mode => {
        const input: CraftTransactionInput = {
          ...mockDelegationInput,
          mode,
          recipient: "invalid-address",
        };

        expect(() => craftTransaction(input)).toThrow(
          "craftTransaction failed: invalid recipient address format",
        );
      });

      it.each(delegationModes)("%s mode validates nonce is non-negative", mode => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode, nonce: -1 };

        expect(() => craftTransaction(input)).toThrow(
          "craftTransaction failed: nonce cannot be negative",
        );
      });
    });

    describe("gas limit selection", () => {
      it("delegate mode uses GAS.DELEGATE by default", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "delegate" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(GAS.DELEGATE);
        expect(parsed.gasLimit).toBe(75000000);
      });

      it("unDelegate mode uses GAS.DELEGATE by default", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "unDelegate" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(GAS.DELEGATE);
        expect(parsed.gasLimit).toBe(75000000);
      });

      it("claimRewards mode uses GAS.CLAIM by default", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "claimRewards" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(GAS.CLAIM);
        expect(parsed.gasLimit).toBe(6000000);
      });

      it("withdraw mode uses GAS.CLAIM by default", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "withdraw" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(GAS.CLAIM);
        expect(parsed.gasLimit).toBe(6000000);
      });

      it("reDelegateRewards mode uses GAS.CLAIM by default", () => {
        const input: CraftTransactionInput = { ...mockDelegationInput, mode: "reDelegateRewards" };
        const result = craftTransaction(input);
        const parsed = JSON.parse(result.transaction);

        expect(parsed.gasLimit).toBe(GAS.CLAIM);
        expect(parsed.gasLimit).toBe(6000000);
      });
    });
  });
});
