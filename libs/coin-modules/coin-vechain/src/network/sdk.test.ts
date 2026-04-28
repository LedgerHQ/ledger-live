import BigNumber from "bignumber.js";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import {
  getAccount,
  getBlockRef,
  getFees,
  getLastBlockHeight,
  getOperations,
  getTokenOperations,
} from "./sdk";
import { AccountResponse } from "../types";
import { Operation } from "@ledgerhq/types-live";

const LAST_BLOCK_COUNT = 24580112;
const mockAccount = {
  balance: "",
  energy: "",
  hasCode: false,
};

const mockGetTransferLogs = jest.fn(async (): Promise<{ data: Operation[] }> => ({ data: [] }));
const mockGetEventLogs = jest.fn(async (): Promise<{ data: Operation[] }> => ({ data: [] }));
const mockGetAccount = jest.fn(
  async (): Promise<{ data: AccountResponse }> => ({ data: mockAccount }),
);
const mockGetLastBlockCount = jest.fn(
  async (): Promise<{ data: { number: number; id: string } }> => ({
    data: { number: LAST_BLOCK_COUNT, id: "abcdefghiklmnopqrstuvwxyz" },
  }),
);
const mockGetFees = jest.fn(
  async (): Promise<{ data: { paid: string } }> => ({
    data: { paid: "42" },
  }),
);

jest.mock("../common-logic", () => ({
  mapTokenTransfersToOperations: jest.fn(() => [{}]),
  mapVetTransfersToOperations: jest.fn(() => [{}]),
  padAddress: jest.fn(),
}));

jest.mock("@ledgerhq/live-network", () => {
  return async (args: { method: string; url: string; data: string }) => {
    if (args.url.match(/\/logs\/transfer$/)) {
      return mockGetTransferLogs();
    }

    if (args.url.match(/\/logs\/event$/)) {
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

describe("sdk", () => {
  describe("getAccount", () => {
    test("retrieves an account", async () => {
      const account = await getAccount("0xmy-address");
      expect(account).toBe(mockAccount);
    });
  });

  describe("getLastBlockHeight", () => {
    test("retrieves the last block height", async () => {
      const account = await getLastBlockHeight();
      expect(account).toBe(LAST_BLOCK_COUNT);
    });
  });

  describe("getBlockRef", () => {
    test("retrieves the block ref to use in transaction", async () => {
      const account = await getBlockRef();
      expect(account).toBe("abcdefghiklmnopqrs");
    });
  });

  describe("getFees", () => {
    test("retrieves fees paid for the transaction", async () => {
      const account = await getFees("0xtransaxtion");
      expect(account).toStrictEqual(new BigNumber(42));
    });
  });

  describe("getOperations", () => {
    describe("when logs retrieved in each network request are within the maximum allowed limit", () => {
      test("retrieves all the operations", async () => {
        const operations = await getOperations(
          "my-account-id",
          "0xmy-address",
          LAST_BLOCK_COUNT - 1,
          LAST_BLOCK_COUNT,
        );

        expect(operations.length > 0).toBe(true);
        expect(operations.length).toBe(1);
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
              "my-account-id",
              "0xmy-address",
              LAST_BLOCK_COUNT - 1,
              LAST_BLOCK_COUNT,
            );
          } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            const error = err as { message: string };
            expect(error.message).toMatch(/Unable to split/);
          }

          expect.assertions(1);
        });
      });

      describe("and Vechain operations range can be split further", () => {
        test("retrieves all the operations", async () => {
          const operations = await getOperations(
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
    describe("when logs retrieved in each network request are within the maximum allowed limit", () => {
      test("retrieves all the operations", async () => {
        const operations = await getTokenOperations(
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

    describe("when logged operations exceed limit in the given range", () => {
      beforeEach(() => {
        mockGetEventLogs.mockImplementationOnce(throws403ExceedsLimit);
      });

      describe("and Vechain operations range cannot be split further", () => {
        test("throws an error: Unable to split Vechain operations range further", async () => {
          try {
            await getTokenOperations(
              "my-account-id",
              "0xmy-address",
              "0xmt-token-address",
              LAST_BLOCK_COUNT - 1,
              LAST_BLOCK_COUNT,
            );
          } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            const error = err as { message: string };
            expect(error.message).toMatch(/Unable to split/);
          }

          expect.assertions(1);
        });
      });

      describe("and Vechain operations range can be split further", () => {
        test("retrieves all the operations", async () => {
          const operations = await getTokenOperations(
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
