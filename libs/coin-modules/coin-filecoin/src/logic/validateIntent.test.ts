import { validateIntent } from "./validateIntent";
import type {
  TransactionIntent,
  Balance,
  MemoNotSupported,
} from "@ledgerhq/coin-framework/api/index";

// Use the valid F1_ADDRESS for tests since TEST_ADDRESSES.RECIPIENT_F1 has invalid checksum
const VALID_SENDER = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";
// Use same address for recipient in tests (self-transfer is valid)
const VALID_RECIPIENT = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";
// f4 addresses (delegated) for token tests - use valid Ethereum address format
const VALID_ETH_RECIPIENT = "0x1234567890123456789012345678901234567890";
const VALID_ERC20_CONTRACT = "0xabcdef1234567890abcdef1234567890abcdef12";

describe("validateIntent", () => {
  const createIntent = (
    overrides?: Partial<TransactionIntent<MemoNotSupported>>,
  ): TransactionIntent<MemoNotSupported> => ({
    intentType: "transaction",
    type: "send",
    sender: VALID_SENDER,
    recipient: VALID_RECIPIENT,
    amount: 100000000000000000n,
    asset: { type: "native" },
    ...overrides,
  });

  const createBalances = (
    native: bigint,
    token?: { address: string; value: bigint },
  ): Balance[] => {
    const balances: Balance[] = [{ value: native, asset: { type: "native" } }];
    if (token) {
      balances.push({
        value: token.value,
        asset: { type: "erc20", assetReference: token.address },
      });
    }
    return balances;
  };

  describe("sender validation", () => {
    it("should have error for empty sender", async () => {
      const intent = createIntent({ sender: "" });
      const balances = createBalances(1000000000000000000n);

      const result = await validateIntent(intent, balances);

      expect(result.errors.sender).toBeDefined();
      expect(result.errors.sender.message).toContain("Invalid sender");
    });

    it("should have error for invalid sender address", async () => {
      const intent = createIntent({ sender: "invalid" });
      const balances = createBalances(1000000000000000000n);

      const result = await validateIntent(intent, balances);

      expect(result.errors.sender).toBeDefined();
    });
  });

  describe("recipient validation", () => {
    it("should have error for empty recipient", async () => {
      const intent = createIntent({ recipient: "" });
      const balances = createBalances(1000000000000000000n);

      const result = await validateIntent(intent, balances);

      expect(result.errors.recipient).toBeDefined();
      expect(result.errors.recipient.message).toContain("Invalid recipient");
    });

    it("should have error for invalid recipient address", async () => {
      const intent = createIntent({ recipient: "notvalid" });
      const balances = createBalances(1000000000000000000n);

      const result = await validateIntent(intent, balances);

      expect(result.errors.recipient).toBeDefined();
    });
  });

  describe("amount validation", () => {
    it("should have error for zero amount", async () => {
      const intent = createIntent({ amount: 0n });
      const balances = createBalances(1000000000000000000n);

      const result = await validateIntent(intent, balances);

      expect(result.errors.amount).toBeDefined();
      expect(result.errors.amount.message).toContain("greater than 0");
    });

    it("should have error for insufficient balance", async () => {
      const intent = createIntent({ amount: 2000000000000000000n });
      const balances = createBalances(1000000000000000000n);
      const customFees = { value: 100000000000n };

      const result = await validateIntent(intent, balances, customFees);

      expect(result.errors.amount).toBeDefined();
      expect(result.errors.amount.message).toContain("Insufficient balance");
    });
  });

  describe("native transfer validation", () => {
    it("should pass validation for valid native transfer", async () => {
      const intent = createIntent({ amount: 100000000000000000n });
      const balances = createBalances(1000000000000000000n);
      const customFees = { value: 100000000000n };

      const result = await validateIntent(intent, balances, customFees);

      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.amount).toBe(100000000000000000n);
      expect(result.totalSpent).toBe(100000000000000000n + 100000000000n);
    });

    it("should calculate totalSpent correctly", async () => {
      const intent = createIntent({ amount: 100000000000000000n });
      const balances = createBalances(500000000000000000n);
      const customFees = { value: 50000000000n };

      const result = await validateIntent(intent, balances, customFees);

      expect(result.totalSpent).toBe(100000000000000000n + 50000000000n);
    });
  });

  describe("token transfer validation", () => {
    it("should validate token recipient is Ethereum-compatible", async () => {
      // f1 addresses (VALID_RECIPIENT) are not valid for token transfers
      const intent = createIntent({
        recipient: VALID_RECIPIENT, // f1 address, not Ethereum-compatible
        asset: { type: "erc20", assetReference: VALID_ERC20_CONTRACT },
      });
      const balances = createBalances(1000000000000000000n, {
        address: VALID_ERC20_CONTRACT,
        value: 500000000000000000n,
      });

      const result = await validateIntent(intent, balances);

      expect(result.errors.recipient).toBeDefined();
      expect(result.errors.recipient.message).toContain("Invalid recipient for token transfer");
    });

    it("should accept valid Ethereum-compatible recipient for token transfer", async () => {
      const intent = createIntent({
        recipient: VALID_ETH_RECIPIENT, // Ethereum address is valid for token transfers
        asset: { type: "erc20", assetReference: VALID_ERC20_CONTRACT },
        amount: 100000000000000000n,
      });
      const balances = createBalances(1000000000000000000n, {
        address: VALID_ERC20_CONTRACT,
        value: 500000000000000000n,
      });
      const customFees = { value: 100000000000n };

      const result = await validateIntent(intent, balances, customFees);

      expect(result.errors.recipient).toBeUndefined();
    });

    it("should have error for insufficient token balance", async () => {
      const intent = createIntent({
        recipient: VALID_ETH_RECIPIENT,
        asset: { type: "erc20", assetReference: VALID_ERC20_CONTRACT },
        amount: 1000000000000000000n,
      });
      const balances = createBalances(1000000000000000000n, {
        address: VALID_ERC20_CONTRACT,
        value: 100000000000000000n, // Less than amount
      });

      const result = await validateIntent(intent, balances);

      expect(result.errors.amount).toBeDefined();
      expect(result.errors.amount.message).toContain("Insufficient token balance");
    });

    it("should have error for insufficient FIL for fees", async () => {
      const intent = createIntent({
        recipient: VALID_ETH_RECIPIENT,
        asset: { type: "erc20", assetReference: VALID_ERC20_CONTRACT },
        amount: 100000000000000000n,
      });
      const balances = createBalances(1000n, {
        // Very low FIL balance
        address: VALID_ERC20_CONTRACT,
        value: 500000000000000000n,
      });
      const customFees = { value: 100000000000n };

      const result = await validateIntent(intent, balances, customFees);

      expect(result.errors.amount).toBeDefined();
      expect(result.errors.amount.message).toContain(
        "Insufficient FIL balance for transaction fees",
      );
    });
  });

  describe("return values", () => {
    it("should return estimatedFees from customFees", async () => {
      const intent = createIntent();
      const balances = createBalances(1000000000000000000n);
      const customFees = { value: 123456789n };

      const result = await validateIntent(intent, balances, customFees);

      expect(result.estimatedFees).toBe(123456789n);
    });

    it("should return 0n for estimatedFees when no customFees provided", async () => {
      const intent = createIntent();
      const balances = createBalances(1000000000000000000n);

      const result = await validateIntent(intent, balances);

      expect(result.estimatedFees).toBe(0n);
    });
  });
});
