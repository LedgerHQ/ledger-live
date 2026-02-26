import invariant from "invariant";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getEnv } from "@ledgerhq/live-env";
import { createApi } from "../api";
import { TRANSACTION_TYPE } from "../constants";
import { deserializeTransaction } from "../logic/utils";

describe("createApi", () => {
  const emptyAccountAddress = "aleo172yejeypnffsdft3nrlpwnu964sn83p7ga6dm5zj7ucmqfqjk5rq3pmx6f";
  const testAccountAddress = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";

  const api = createApi(
    {
      networkType: "testnet",
      apiUrls: {
        node: getEnv("ALEO_TESTNET_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_TESTNET_SDK_ENDPOINT"),
      },
      feeByTransactionType: {
        [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 34060,
        [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2308,
        [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17972,
        [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18494,
      },
      feeSafetyMultiplier: 1,
    },
    "aleo",
  );

  beforeAll(() => {
    setupCalClientStore();
  });

  describe("estimateFees", () => {
    it("should return fee for coin transfer transaction", async () => {
      const fees = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
        amount: 100n,
        sender: testAccountAddress,
        recipient: emptyAccountAddress,
      });

      expect(fees.value).toBeGreaterThanOrEqual(0n);
    });
  });

  describe("craftTransaction", () => {
    const mockAmountRecord =
      "record1qvqsps6wqrka73247spvsvdlgwr8qhmn5f4uze4t8zutp4k8mwm3zdgtqyxx66trwfhkxun9v35hguerqqpqzqrpdge64jwzyz32aknuxc800uugfwv52pqse4dk4p32datlzpd8z95td5t0dhdm4dfhtq9w285uj2arltzky4u6hmdv2xpdnkv365l3qg9hn0g";

    describe("public transfers", () => {
      it.each([
        ["minimal amount", 1n, false],
        ["typical amount", 123n, true],
        ["large amount", 1_000_000_000n, false],
      ] as const)(
        "should craft valid transaction with %s",
        async (_descr: string, amount: bigint, includeInputTypesValidation: boolean) => {
          const { transaction } = await api.craftTransaction({
            intentType: "transaction",
            asset: { type: "native" },
            type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
            amount,
            sender: testAccountAddress,
            recipient: emptyAccountAddress,
          });

          expect(typeof transaction).toBe("string");
          expect(transaction.length).toBeGreaterThan(0);

          const deserialized = deserializeTransaction(transaction);
          expect(deserialized).toMatchObject({
            is_root: true,
          });
          expect(deserialized.network_id).toBeGreaterThan(0);
          expect(typeof deserialized.program_id).toBe("string");
          expect(deserialized.program_id.length).toBeGreaterThan(0);
          expect(typeof deserialized.function_name).toBe("string");
          expect(deserialized.function_name.length).toBeGreaterThan(0);
          expect(Array.isArray(deserialized.inputs)).toBe(true);
          expect(deserialized.inputs.length).toBeGreaterThan(0);
          expect(
            deserialized.inputs.every(input => typeof input === "string" && input.length > 0),
          ).toBe(true);

          if (includeInputTypesValidation) {
            expect(Array.isArray(deserialized.input_types)).toBe(true);
            expect(deserialized.input_types.length).toBeGreaterThan(0);
            expect(
              deserialized.input_types.every(
                inputType => typeof inputType === "string" && inputType.length > 0,
              ),
            ).toBe(true);
          }
        },
      );
    });

    describe("private transfers", () => {
      it("should craft a valid private transfer transaction with record", async () => {
        const amount = 50n;
        const { transaction } = await api.craftTransaction({
          intentType: "transaction",
          asset: { type: "native" },
          type: "transfer_private",
          amount,
          sender: testAccountAddress,
          recipient: emptyAccountAddress,
          data: {
            type: "private",
            amountRecord: mockAmountRecord,
          },
        });

        expect(typeof transaction).toBe("string");

        const deserialized = deserializeTransaction(transaction);
        expect(deserialized).toHaveProperty("type", "BAD_REQUEST");
        expect(deserialized).toHaveProperty("code", 400);
        if ("message" in deserialized) {
          expect(deserialized.message).toContain("deserialize error");
        }
      });

      it("should throw when private data is missing for private transfer", async () => {
        await expect(
          api.craftTransaction({
            intentType: "transaction",
            asset: { type: "native" },
            type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
            amount: 50n,
            sender: testAccountAddress,
            recipient: emptyAccountAddress,
          }),
        ).rejects.toThrow("private data is required");
      });

      it("should throw when record is missing in private data", async () => {
        const { transaction } = await api.craftTransaction({
          intentType: "transaction",
          asset: { type: "native" },
          type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
          amount: 50n,
          sender: testAccountAddress,
          recipient: emptyAccountAddress,
          data: {
            type: "private",
          },
        });

        const deserialized = deserializeTransaction(transaction);
        expect(deserialized).toHaveProperty("type", "BAD_REQUEST");
        expect(deserialized).toHaveProperty("code", 400);
      });
    });

    describe("public to private conversions", () => {
      it.each([
        ["same address", 100n, testAccountAddress],
        ["different addresses", 200n, emptyAccountAddress],
      ] as const)(
        "should craft valid conversion with %s",
        async (_descr: string, amount: bigint, recipient: string) => {
          const { transaction } = await api.craftTransaction({
            intentType: "transaction",
            asset: { type: "native" },
            type: "transfer_public_to_private",
            amount,
            sender: testAccountAddress,
            recipient,
          });

          expect(typeof transaction).toBe("string");

          const deserialized = deserializeTransaction(transaction);
          expect(deserialized.is_root).toBe(true);
          expect(typeof deserialized.program_id).toBe("string");
          expect(deserialized.program_id.length).toBeGreaterThan(0);
          expect(typeof deserialized.function_name).toBe("string");
          expect(deserialized.function_name.length).toBeGreaterThan(0);
          expect(Array.isArray(deserialized.inputs)).toBe(true);
          expect(deserialized.inputs.length).toBeGreaterThan(0);
          expect(
            deserialized.inputs.every(input => typeof input === "string" && input.length > 0),
          ).toBe(true);
        },
      );
    });

    describe("private to public conversions", () => {
      it("should craft a valid convert private to public transaction with record", async () => {
        const amount = 75n;
        const { transaction } = await api.craftTransaction({
          intentType: "transaction",
          asset: { type: "native" },
          type: "transfer_private_to_public",
          amount,
          sender: testAccountAddress,
          recipient: testAccountAddress,
          data: {
            type: "private",
            amountRecord: mockAmountRecord,
          },
        });

        expect(typeof transaction).toBe("string");

        const deserialized = deserializeTransaction(transaction);
        expect(deserialized).toHaveProperty("type", "BAD_REQUEST");
        expect(deserialized).toHaveProperty("code", 400);
        if ("message" in deserialized) {
          expect(deserialized.message).toContain("deserialize error");
        }
      });

      it("should throw when private data is missing for convert private to public", async () => {
        await expect(
          api.craftTransaction({
            intentType: "transaction",
            asset: { type: "native" },
            type: "transfer_private_to_public",
            amount: 75n,
            sender: testAccountAddress,
            recipient: testAccountAddress,
          }),
        ).rejects.toThrow("private data is required");
      });

      it("should throw when amountRecord is missing in private data for conversion", async () => {
        const { transaction } = await api.craftTransaction({
          intentType: "transaction",
          asset: { type: "native" },
          type: "transfer_private_to_public",
          amount: 75n,
          sender: testAccountAddress,
          recipient: testAccountAddress,
          data: {
            type: "private",
          },
        });

        const deserialized = deserializeTransaction(transaction);
        expect(deserialized).toHaveProperty("type", "BAD_REQUEST");
        expect(deserialized).toHaveProperty("code", 400);
      });
    });

    describe("edge cases", () => {
      it.each([
        ["zero amount", 0n, testAccountAddress, emptyAccountAddress, { expectValid: true }],
        [
          "invalid recipient address",
          100n,
          testAccountAddress,
          "invalid_address",
          {
            expectValid: false,
            errorType: "INVALID_INTENT" as const,
            errorMessage: "Invalid recipient address",
          },
        ],
        [
          "invalid sender address",
          100n,
          "invalid_address",
          emptyAccountAddress,
          { expectValid: true },
        ],
      ] as const)(
        "should handle %s",
        async (
          _descr: string,
          amount: bigint,
          sender: string,
          recipient: string,
          expectation:
            | { expectValid: true }
            | { expectValid: false; errorType: string; errorMessage: string },
        ) => {
          const { transaction } = await api.craftTransaction({
            intentType: "transaction",
            asset: { type: "native" },
            type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
            amount,
            sender,
            recipient,
          });

          expect(typeof transaction).toBe("string");
          const deserialized = deserializeTransaction(transaction);

          if (expectation.expectValid) {
            expect(deserialized.is_root).toBe(true);
            expect(typeof deserialized.program_id).toBe("string");
            expect(deserialized.program_id.length).toBeGreaterThan(0);
            expect(typeof deserialized.function_name).toBe("string");
            expect(deserialized.function_name.length).toBeGreaterThan(0);
          } else {
            expect(deserialized).toHaveProperty("type", expectation.errorType);
            expect(deserialized).toHaveProperty("code", 400);
            if ("message" in deserialized) {
              expect(deserialized.message).toContain(expectation.errorMessage);
            }
          }
        },
      );
    });
  });

  describe("listOperations", () => {
    it("should return empty array for pristine account", async () => {
      const { items: operations } = await api.listOperations(emptyAccountAddress, {
        minHeight: 0,
        order: "desc",
      });

      expect(operations).toEqual([]);
    });

    it("should return operations with correct metadata", async () => {
      const testTxId = "at1qe8ml060qvvqp5caxejnc2r4sj3yjx83nfe9mykyx0zyhv5h5yzsfa85j0";
      const testBlockHashOfTx = "ab1ae88smgn0cr80yzzd84kvupawre67j69xcpthcegmcutqew8wgrs6hrxh8";
      const { items: page } = await api.listOperations(testAccountAddress, {
        minHeight: 0,
        limit: 10,
        order: "asc",
      });

      const operation = page.find(op => op.tx.hash === testTxId);

      expect(operation).toMatchObject({
        value: 20n,
        asset: { type: "native" },
        tx: {
          hash: testTxId,
          fees: 51060n,
          failed: false,
          block: {
            hash: testBlockHashOfTx,
            height: 168835,
          },
        },
      });
    });

    it.each(["desc", "asc"] as const)(
      "should return paginated operations for account with high activity (%s)",
      async order => {
        const limit = 10;
        const { items: page1, next: cursor1 } = await api.listOperations(testAccountAddress, {
          minHeight: 0,
          limit,
          order,
        });

        const { items: page2, next: cursor2 } = await api.listOperations(testAccountAddress, {
          minHeight: 0,
          limit,
          order,
          cursor: cursor1,
        });

        const firstPage1Timestamp = page1[0]?.tx?.date;
        const firstPage2Timestamp = page2[0]?.tx?.date;
        const lastPage1Timestamp = page1.at(-1)?.tx?.date;
        const lastPage2Timestamp = page2.at(-1)?.tx?.date;
        const page1Hashes = new Set(page1.map(op => op.tx.hash));
        const page2Hashes = new Set(page2.map(op => op.tx.hash));
        const hasOverlap = [...page2Hashes].some(hash => page1Hashes.has(hash));

        // NOTE: this won't be equal to limit, because single transaction can generate multiple operations
        expect(page1.length).toBeGreaterThanOrEqual(limit);
        expect(page2.length).toBeGreaterThanOrEqual(limit);
        expect(cursor1).not.toBe("");
        expect(cursor2).not.toBe("");
        expect(hasOverlap).toBe(false);
        expect(firstPage1Timestamp).toBeInstanceOf(Date);
        expect(firstPage2Timestamp).toBeInstanceOf(Date);
        expect(lastPage1Timestamp).toBeInstanceOf(Date);
        expect(lastPage2Timestamp).toBeInstanceOf(Date);
        invariant(firstPage1Timestamp, "guard: missing firstPage1Timestamp");
        invariant(firstPage2Timestamp, "guard: missing firstPage2Timestamp");
        invariant(lastPage1Timestamp, "guard: missing lastPage1Timestamp");
        invariant(lastPage2Timestamp, "guard: missing lastPage2Timestamp");
        expect(lastPage1Timestamp > firstPage2Timestamp).toBe(order === "desc");
        expect(firstPage1Timestamp < lastPage2Timestamp).toBe(order === "asc");
      },
    );

    it.each(["desc", "asc"] as const)(
      "should return operations with min height filter (%s)",
      async order => {
        const minHeight = order === "asc" ? 200_000 : 13_940_000;
        const { items: page } = await api.listOperations(testAccountAddress, {
          minHeight,
          limit: 10,
          order,
        });

        expect(page.length).toBeGreaterThan(0);
        expect(page.every(op => op.tx.block.height >= minHeight)).toBe(true);
      },
    );
  });

  describe("lastBlock", () => {
    it("should return the last block information", async () => {
      const lastBlock = await api.lastBlock();

      expect(lastBlock.height).toBeGreaterThan(0);
      expect(lastBlock.hash?.length).toBeGreaterThan(0);
      expect(lastBlock.time?.getTime()).toBeGreaterThan(0);
    });
  });

  describe("getBalance", () => {
    it.each([
      [
        "valid address with balance",
        "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f",
        { expectBalance: true, shouldThrow: false },
      ],
      [
        "valid address without balance",
        "aleo1g82wnc9um2f50a64a8xnsfz6meqkl3e7rk3q327vc47kykxway8qphwg9p",
        { expectBalance: false, shouldThrow: false },
      ],
      ["invalid address", "invalid_address", { shouldThrow: true }],
    ] as const)(
      "should handle %s",
      async (
        _descr: string,
        address: string,
        expectation: { shouldThrow: true } | { expectBalance: boolean; shouldThrow: false },
      ) => {
        if (expectation.shouldThrow) {
          await expect(api.getBalance(address)).rejects.toThrow();
        } else {
          const balance = await api.getBalance(address);
          expect(balance).toBeInstanceOf(Array);

          if (expectation.expectBalance) {
            expect(balance.length).toBeGreaterThanOrEqual(0);
            expect(balance.every(b => b.value > 0n)).toBe(true);
          } else {
            expect(balance).toEqual([]);
          }
        }
      },
    );
  });
});
