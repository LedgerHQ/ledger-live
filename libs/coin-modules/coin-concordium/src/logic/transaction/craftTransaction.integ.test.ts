import BigNumber from "bignumber.js";
import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";
import { AccountAddress } from "@ledgerhq/hw-app-concordium/lib/address";
import { craftTransaction } from "./craftTransaction";

describe("craftTransaction", () => {
  const SENDER_ADDRESS = "3U6m951FWryY56SKFFHgMLGVHtJtk4VaxN7V2F9hjkR7Sg1FUx";
  const RECIPIENT_ADDRESS = "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh";

  describe("Simple transfer", () => {
    it("should create a valid transaction with minimum required fields", async () => {
      const account = {
        address: SENDER_ADDRESS,
        nextSequenceNumber: 5,
      };

      const transaction = {
        recipient: RECIPIENT_ADDRESS,
        amount: new BigNumber(1000000),
        energy: BigInt(500),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.type).toBe(TransactionType.Transfer);
      expect(result.header.sender).toEqual(AccountAddress.fromBase58(SENDER_ADDRESS));
      expect(result.header.nonce).toBe(BigInt(5));
      expect(result.header.energyAmount).toBe(BigInt(500));
      expect(result.header.expiry).toBeGreaterThan(BigInt(Math.floor(Date.now() / 1000)));
      expect(result.payload.amount).toBe(BigInt(1000000));
      expect(result.payload.toAddress).toEqual(AccountAddress.fromBase58(RECIPIENT_ADDRESS));
    });

    it("should handle large amounts correctly", async () => {
      const account = {
        address: SENDER_ADDRESS,
        nextSequenceNumber: 1,
      };

      const transaction = {
        recipient: RECIPIENT_ADDRESS,
        amount: new BigNumber("1000000000000"),
        energy: BigInt(500),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.payload.amount).toBe(BigInt("1000000000000"));
    });

    it("should use default nonce when not provided", async () => {
      const account = {
        address: SENDER_ADDRESS,
      };

      const transaction = {
        recipient: RECIPIENT_ADDRESS,
        amount: new BigNumber(1000000),
        energy: BigInt(500),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.header.nonce).toBe(BigInt(0));
    });

    it("should set expiry to approximately 1 hour from now", async () => {
      const account = {
        address: SENDER_ADDRESS,
        nextSequenceNumber: 5,
      };

      const transaction = {
        recipient: RECIPIENT_ADDRESS,
        amount: new BigNumber(1000000),
        energy: BigInt(500),
      };

      const beforeTimestamp = Math.floor(Date.now() / 1000);
      const result = await craftTransaction(account, transaction);
      const afterTimestamp = Math.floor(Date.now() / 1000);

      const expiry = Number(result.header.expiry);
      expect(expiry).toBeGreaterThanOrEqual(beforeTimestamp + 3600);
      expect(expiry).toBeLessThanOrEqual(afterTimestamp + 3600);
    });
  });

  describe("Transfer with memo", () => {
    it("should create a valid transaction with memo", async () => {
      const account = {
        address: SENDER_ADDRESS,
        nextSequenceNumber: 5,
      };

      const transaction = {
        recipient: RECIPIENT_ADDRESS,
        amount: new BigNumber(1000000),
        energy: BigInt(1000),
        memo: "Test memo",
      };

      const result = await craftTransaction(account, transaction);

      expect(result.type).toBe(TransactionType.TransferWithMemo);
      expect(result.payload.memo).toBeInstanceOf(Buffer);
      expect(result.payload.memo!.length).toBeGreaterThan(0);
    });

    it("should encode memo correctly", async () => {
      const account = {
        address: SENDER_ADDRESS,
        nextSequenceNumber: 5,
      };

      const memoText = "Hello Concordium";
      const transaction = {
        recipient: RECIPIENT_ADDRESS,
        amount: new BigNumber(1000000),
        energy: BigInt(1000),
        memo: memoText,
      };

      const result = await craftTransaction(account, transaction);

      expect(result.payload.memo).toBeInstanceOf(Buffer);
    });

    it("should handle empty memo string", async () => {
      const account = {
        address: SENDER_ADDRESS,
        nextSequenceNumber: 5,
      };

      const transaction = {
        recipient: RECIPIENT_ADDRESS,
        amount: new BigNumber(1000000),
        energy: BigInt(1000),
        memo: "",
      };

      const result = await craftTransaction(account, transaction);

      expect(result.type).toBe(TransactionType.Transfer);
      expect(result.payload.memo).toBeUndefined();
    });
  });

  describe("Transaction structure validation", () => {
    it("should have all required header fields", async () => {
      const account = {
        address: SENDER_ADDRESS,
        nextSequenceNumber: 10,
      };

      const transaction = {
        recipient: RECIPIENT_ADDRESS,
        amount: new BigNumber(5000000),
        energy: BigInt(750),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.header).toHaveProperty("sender");
      expect(result.header).toHaveProperty("nonce");
      expect(result.header).toHaveProperty("expiry");
      expect(result.header).toHaveProperty("energyAmount");
    });

    it("should have all required payload fields", async () => {
      const account = {
        address: SENDER_ADDRESS,
        nextSequenceNumber: 10,
      };

      const transaction = {
        recipient: RECIPIENT_ADDRESS,
        amount: new BigNumber(5000000),
        energy: BigInt(750),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.payload).toHaveProperty("amount");
      expect(result.payload).toHaveProperty("toAddress");
    });

    it("should handle zero amount", async () => {
      const account = {
        address: SENDER_ADDRESS,
        nextSequenceNumber: 5,
      };

      const transaction = {
        recipient: RECIPIENT_ADDRESS,
        amount: new BigNumber(0),
        energy: BigInt(500),
      };

      const result = await craftTransaction(account, transaction);

      expect(result.payload.amount).toBe(BigInt(0));
    });

    it("should handle different nonce values", async () => {
      const testCases = [0, 1, 100, 1000, 999999];

      for (const nonce of testCases) {
        const account = {
          address: SENDER_ADDRESS,
          nextSequenceNumber: nonce,
        };

        const transaction = {
          recipient: RECIPIENT_ADDRESS,
          amount: new BigNumber(1000000),
          energy: BigInt(500),
        };

        const result = await craftTransaction(account, transaction);
        expect(result.header.nonce).toBe(BigInt(nonce));
      }
    });
  });
});
