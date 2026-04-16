import { LedgerAPI4xx } from "@ledgerhq/errors";
import { getOperations, getTokenOperations } from "./sdk";

const mockTransferLogs = jest.fn(() => ({ data: [] }));
const mockEventLogs = jest.fn(() => ({ data: [] }));

jest.mock("../common-logic", () => ({
  mapTokenTransfersToOperations: jest.fn(() => [{}]),
  mapVetTransfersToOperations: jest.fn(() => [{}]),
  padAddress: jest.fn(),
}));

jest.mock("@ledgerhq/live-network", () => {
  return async (args: { method: string; url: string; data: string }) => {
    if (args.url.match(/\/logs\/transfer$/)) {
      return mockTransferLogs();
    }

    if (args.url.match(/\/logs\/event$/)) {
      return mockEventLogs();
    }
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

const LAST_BLOCK_COUNT = 24580112;

describe("sdk", () => {
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
        mockTransferLogs.mockImplementationOnce(throws403ExceedsLimit);
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
        mockEventLogs.mockImplementationOnce(throws403ExceedsLimit);
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
