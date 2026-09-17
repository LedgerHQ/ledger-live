import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { LedgerAPI4xx } from "@ledgerhq/live-network/errors";
import {
  getAccount,
  getBlockRef,
  getLastBlockHeight,
  getOperations,
  getTokenOperations,
  submit,
} from "./sdk";
import { getFees } from "./getFees";
import type { AccountResponse, VechainSDKTransaction } from "../types";
import { mockVechainConfig } from "../test/context";

const LAST_BLOCK_COUNT = 24580112;
// keccak256("Transfer(address,address,uint256)") -- spelled out rather than imported, so the
// assertion below pins the wire value instead of restating whatever the module happens to export.
const TRANSFER_EVENT_SIGNATURE =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const mockAccount = {
  balance: "",
  energy: "",
  hasCode: false,
};
const mockTransaction: VechainSDKTransaction = {
  get encoded() {
    return new Uint8Array();
  },
} as unknown as VechainSDKTransaction;

// Raw bodies of every POST /logs/event, so the serialized Thor criteria can be asserted.
const eventLogRequestBodies: string[] = [];

const mockGetTransferLogs = jest.fn(async (): Promise<{ data: Operation[] }> => ({ data: [] }));
const mockGetEventLogs = jest.fn(async (): Promise<{ data: Operation[] }> => ({ data: [] }));
const mockGetAccount = jest.fn(async (): Promise<{ data: AccountResponse }> => ({
  data: mockAccount,
}));
const mockGetLastBlockCount = jest.fn(
  async (): Promise<{ data: { number: number; id: string } }> => ({
    data: { number: LAST_BLOCK_COUNT, id: "abcdefghiklmnopqrstuvwxyz" },
  }),
);
const mockGetFees = jest.fn(
  async (): Promise<{
    data: { paid?: string; gasPayer?: string; meta?: { txOrigin?: string } };
  }> => ({
    data: { paid: "42" },
  }),
);
const mockSubmit = jest.fn(async (): Promise<{ data: { id?: string } }> => ({
  data: { id: "123" },
}));

// This factory replaces the whole `../common-logic` barrel, so every binding `sdk.ts` imports
// from it has to be listed here. `VIP180_TRANSFER_TOPIC` is taken from the real module instead of
// being hardcoded, so it cannot drift: were it missing it would be `undefined`, JSON.stringify
// would drop `topic0` from the criteria, and the token-operation tests below would silently
// exercise a Thor query with no topic filter at all. `./vip180` is required directly rather than
// through the barrel so the rest of it (and its network imports) stays out of the mock.
jest.mock("../common-logic", () => ({
  mapTokenTransfersToOperations: jest.fn(() => [{}]),
  mapVetTransfersToOperations: jest.fn(() => [{}]),
  // Deterministic so the serialized criteria can be asserted below.
  padAddress: jest.fn((address: string) => `0x${address.replace(/^0x/, "").padStart(64, "0")}`),
  VIP180_TRANSFER_TOPIC: jest.requireActual("../common-logic/vip180").VIP180_TRANSFER_TOPIC,
}));

jest.mock("@ledgerhq/live-network", () => {
  return async (args: { method: string; url: string; data: string }) => {
    if (args.url.match(/\/logs\/transfer$/)) {
      return mockGetTransferLogs();
    }

    if (args.url.match(/\/logs\/event$/)) {
      eventLogRequestBodies.push(args.data);
      return mockGetEventLogs();
    }

    if (args.url.match(/\/accounts/)) {
      return mockGetAccount();
    }

    if (args.url.match(/\/blocks\/best$/)) {
      return mockGetLastBlockCount();
    }

    if (args.url.match(/\/transactions\/([^/]+)\/receipt$/)) {
      return mockGetFees();
    }

    if (args.url.match(/\/transactions$/)) {
      return mockSubmit();
    }

    return jest.fn();
  };
});

const throws403ExceedsLimit = () => {
  const msg =
    "the number of filtered logs exceeds the maximum allowed value of 1000, please use pagination";

  throw new LedgerAPI4xx(msg, {
    status: 403,
    url: "",
    method: "POST",
  });
};

const throws500ServerError = () => {
  const msg = "internal server error";

  throw new LedgerAPI4xx(msg, {
    status: 500,
    url: "",
    method: "POST",
  });
};

describe("sdk", () => {
  describe("getAccount", () => {
    test("retrieves an account", async () => {
      const account = await getAccount(mockVechainConfig, "0xmy-address");
      expect(account).toBe(mockAccount);
    });
  });

  describe("getLastBlockHeight", () => {
    test("retrieves the last block height", async () => {
      const account = await getLastBlockHeight(mockVechainConfig);
      expect(account).toBe(LAST_BLOCK_COUNT);
    });
  });

  describe("getBlockRef", () => {
    test("retrieves the block ref to use in transaction", async () => {
      const account = await getBlockRef(mockVechainConfig);
      expect(account).toBe("abcdefghiklmnopqrs");
    });
  });

  describe("getFees", () => {
    describe("when the transaction's receipt doesn't have any data.paid", () => {
      test("retrieves fees paid for the transaction", async () => {
        mockGetFees.mockImplementationOnce(async () => ({ data: {} }));

        const { fees } = await getFees(mockVechainConfig, "0xtransaxtion");
        expect(fees).toStrictEqual(new BigNumber(0));
      });
    });

    describe("when the transaction's receipt has data.paid", () => {
      test("retrieves fees paid for the transaction", async () => {
        const { fees } = await getFees(mockVechainConfig, "0xtransaxtion");
        expect(fees).toStrictEqual(new BigNumber(42));
      });
    });

    test("returns the delegated gas payer declared by the receipt", async () => {
      mockGetFees.mockImplementationOnce(async () => ({
        data: {
          paid: "42",
          gasPayer: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
          meta: { txOrigin: "0x0fe6688548f0c303932bb197b0a96034f1d74dba" },
        },
      }));

      const { gasPayer } = await getFees(mockVechainConfig, "0xtransaxtion");
      expect(gasPayer).toBe("0xcf130b42ae31c4931298b4b1c0f1d974b8732957");
    });

    test("falls back to the transaction origin when the receipt declares no gas payer", async () => {
      mockGetFees.mockImplementationOnce(async () => ({
        data: { paid: "42", meta: { txOrigin: "0x0fe6688548f0c303932bb197b0a96034f1d74dba" } },
      }));

      const { gasPayer } = await getFees(mockVechainConfig, "0xtransaxtion");
      expect(gasPayer).toBe("0x0fe6688548f0c303932bb197b0a96034f1d74dba");
    });

    test("omits the gas payer when the receipt declares neither a payer nor an origin", async () => {
      // The key is absent rather than present-and-undefined: `exactOptionalPropertyTypes` treats
      // those as different types, and the mappers test for presence before writing `extra`.
      mockGetFees.mockImplementationOnce(async () => ({ data: { paid: "42" } }));

      const fees = await getFees(mockVechainConfig, "0xtransaxtion");
      expect(fees).not.toHaveProperty("gasPayer");
    });
  });

  describe("submit", () => {
    describe("when transaction id is included in the transaction payload returned by the server", () => {
      test("returns the transaction id", async () => {
        const transactionId = await submit(mockVechainConfig, mockTransaction);
        expect(transactionId).toBe("123");
      });
    });

    describe("when transaction id isn't included in the transaction payload returned by the server", () => {
      test("throws an error", async () => {
        mockSubmit.mockImplementationOnce(async () => ({ data: {} }));

        try {
          await submit(mockVechainConfig, mockTransaction);
        } catch (err: unknown) {
          const error = err as { message: string };
          expect(error.message).toMatch("Expected an ID");
        }

        expect.assertions(1);
      });
    });
  });

  describe("getOperations", () => {
    describe("when an unhandled error occurs", () => {
      beforeEach(() => {
        mockGetTransferLogs.mockImplementationOnce(throws500ServerError);
      });

      test("rethrows the error", async () => {
        try {
          await getOperations(
            mockVechainConfig,
            "my-account-id",
            "0xmy-address",
            LAST_BLOCK_COUNT - 1,
            LAST_BLOCK_COUNT,
          );
        } catch (err: unknown) {
          const error = err as { message: string };
          expect(error.message).toMatch(/internal server error/);
        }

        expect.assertions(1);
      });
    });

    describe("when logs retrieved in each network request are within the maximum allowed limit", () => {
      test("retrieves all the operations", async () => {
        const operations = await getOperations(
          mockVechainConfig,
          "my-account-id",
          "0xmy-address",
          LAST_BLOCK_COUNT - 1,
          LAST_BLOCK_COUNT,
        );

        expect(operations.length > 0).toBe(true);
        expect(operations.length).toBe(1);
      });
    });

    describe("when the range is inverted (no new block since the last known operation)", () => {
      test("returns an empty array without querying the network", async () => {
        mockGetTransferLogs.mockClear();
        const operations = await getOperations(
          mockVechainConfig,
          "my-account-id",
          "0xmy-address",
          LAST_BLOCK_COUNT + 1,
          LAST_BLOCK_COUNT,
        );

        expect(operations).toEqual([]);
        expect(mockGetTransferLogs).not.toHaveBeenCalled();
      });
    });

    describe("when logged operations exceed limit in the given range", () => {
      beforeEach(() => {
        mockGetTransferLogs.mockImplementationOnce(throws403ExceedsLimit);
      });

      describe("and Vechain operations range cannot be split further", () => {
        test("throws an error: Unable to split Vechain operations range further", async () => {
          try {
            await getOperations(
              mockVechainConfig,
              "my-account-id",
              "0xmy-address",
              LAST_BLOCK_COUNT - 1,
              LAST_BLOCK_COUNT,
            );
          } catch (err: unknown) {
            const error = err as { message: string };
            expect(error.message).toMatch(/Unable to split/);
          }

          expect.assertions(1);
        });
      });

      describe("and Vechain operations range can be split further", () => {
        test("retrieves all the operations", async () => {
          const operations = await getOperations(
            mockVechainConfig,
            "my-account-id",
            "0xmy-address",
            LAST_BLOCK_COUNT - 6,
            LAST_BLOCK_COUNT,
          );

          expect(operations.length > 0).toBe(true);
          expect(operations.length).toBe(2);
        });
      });
    });
  });

  describe("getTokenOperations", () => {
    describe("when an unhandled error occurs", () => {
      beforeEach(() => {
        mockGetTransferLogs.mockImplementationOnce(throws500ServerError);
      });

      test("rethrows the error", async () => {
        try {
          await getOperations(
            mockVechainConfig,
            "my-account-id",
            "0xmy-address",
            LAST_BLOCK_COUNT - 1,
            LAST_BLOCK_COUNT,
          );
        } catch (err: unknown) {
          const error = err as { message: string };
          expect(error.message).toMatch(/internal server error/);
        }

        expect.assertions(1);
      });
    });

    describe("when logs retrieved in each network request are within the maximum allowed limit", () => {
      test("retrieves all the operations", async () => {
        const operations = await getTokenOperations(
          mockVechainConfig,
          "my-account-id",
          "0xmy-address",
          "0xmy-token-address",
          LAST_BLOCK_COUNT - 1,
          LAST_BLOCK_COUNT,
        );

        expect(operations.length > 0).toBe(true);
        expect(operations.length).toBe(1);
      });
    });

    describe("the Thor query it sends", () => {
      test("filters on the VIP-180 Transfer topic for both the sender and the recipient", async () => {
        eventLogRequestBodies.length = 0;

        await getTokenOperations(
          mockVechainConfig,
          "my-account-id",
          "0xmy-address",
          "0xmy-token-address",
          LAST_BLOCK_COUNT - 1,
          LAST_BLOCK_COUNT,
        );

        expect(eventLogRequestBodies).toHaveLength(1);
        const { criteriaSet } = JSON.parse(eventLogRequestBodies[0]);

        // Two criteria: the address as topic1 (sender) and as topic2 (recipient). `topic0` must be
        // present on both -- an undefined topic is dropped by JSON.stringify, which would widen the
        // query from the token's Transfer logs to every event it emits.
        const paddedAddress = `0x${"my-address".padStart(64, "0")}`;
        expect(criteriaSet).toEqual([
          {
            address: "0xmy-token-address",
            topic0: TRANSFER_EVENT_SIGNATURE,
            topic1: paddedAddress,
          },
          {
            address: "0xmy-token-address",
            topic0: TRANSFER_EVENT_SIGNATURE,
            topic2: paddedAddress,
          },
        ]);
      });
    });

    describe("when the range is inverted (no new block since the last known operation)", () => {
      test("returns an empty array without querying the network", async () => {
        mockGetEventLogs.mockClear();
        const operations = await getTokenOperations(
          mockVechainConfig,
          "my-account-id",
          "0xmy-address",
          "0xmy-token-address",
          LAST_BLOCK_COUNT + 1,
          LAST_BLOCK_COUNT,
        );

        expect(operations).toEqual([]);
        expect(mockGetEventLogs).not.toHaveBeenCalled();
      });
    });

    describe("when logged operations exceed limit in the given range", () => {
      beforeEach(() => {
        mockGetEventLogs.mockImplementationOnce(throws403ExceedsLimit);
      });

      describe("and Vechain operations range cannot be split further", () => {
        test("throws an error: Unable to split Vechain operations range further", async () => {
          try {
            await getTokenOperations(
              mockVechainConfig,
              "my-account-id",
              "0xmy-address",
              "0xmt-token-address",
              LAST_BLOCK_COUNT - 1,
              LAST_BLOCK_COUNT,
            );
          } catch (err: unknown) {
            const error = err as { message: string };
            expect(error.message).toMatch(/Unable to split/);
          }

          expect.assertions(1);
        });
      });

      describe("and Vechain operations range can be split further", () => {
        test("retrieves all the operations", async () => {
          const operations = await getTokenOperations(
            mockVechainConfig,
            "my-account-id",
            "0xmy-address",
            "0xmt-token-address",
            LAST_BLOCK_COUNT - 6,
            LAST_BLOCK_COUNT,
          );

          expect(operations.length > 0).toBe(true);
          expect(operations.length).toBe(2);
        });
      });
    });
  });
});
