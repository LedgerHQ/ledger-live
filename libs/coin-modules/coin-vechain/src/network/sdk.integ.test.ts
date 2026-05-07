import { getOperations, getTokenOperations } from "./sdk";
import { getEnv } from "@ledgerhq/live-env";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { EventLog, TransferLog, VetTxsQuery } from "../types";

const BASE_URL = getEnv("API_VECHAIN_THOREST");
const LAST_BLOCK_COUNT = 24580112;
const MAX_OPS_IN_BLOCK_RANGE = 1000;
const N_OPS_IN_BLOCK = 3;

// transfer log (VET)
const transferLogMock: TransferLog = {
  sender: "0xf9a1bc92e0eeee598b9fdb45397107b1f05f6cc1",
  recipient: "0xd9477ef63dee116ed97307010e99fce8ae314af2",
  amount: "0x8cf23f909c0fa00000",
  meta: {
    blockID: "0x015e589bd07a901ed09becd26b34192e1b114e18c132f0ea1e0da32e961a459f",
    blockNumber: 22960283,
    blockTimestamp: 1760133420,
    txID: "0x50b7b6a8b8717127dc7d05c584c607fefcae66bef1f90b35699fd9ae6ef5c12a",
    txOrigin: "0xd9477ef63dee116ed97307010e99fce8ae314af2",
    clauseIndex: 1,
  },
};

// transfer event log (VTHO)
const eventLogMock: EventLog = {
  address: "0x0000000000000000000000000000456e65726779",
  topics: [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x000000000000000000000000d9477ef63dee116ed97307010e99fce8ae314af2",
    "0x0000000000000000000000002b6fc877ff5535b50f6c3e068bb436b16ec76fc5",
  ],
  data: "0x000000000000000000000000000000000000000000000737ab99122945915613",
  meta: {
    blockID: "0x015e58709be6f3118011a15c2bdab9c233bbbea18bdd3d1d1cdad268246d7f95",
    blockNumber: 22960240,
    blockTimestamp: 1760132990,
    txID: "0x0c4497dfd2c2d9fea4e48158867a880356d0ea03de0e49c2d27d4661d404edc1",
    txOrigin: "0xd9477ef63dee116ed97307010e99fce8ae314af2",
    clauseIndex: 0,
  },
};

const serverErrorHandler = async () =>
  HttpResponse.json(
    {
      error: "something went wrong",
    },
    { status: 500 },
  );

// Used by /logs/transfer and /logs/event
const getRangeOfOperationsHandler =
  <T extends TransferLog | EventLog>(logItemMock: T) =>
  async ({ request }: { request: Request }) => {
    const query: VetTxsQuery = await request.json();
    const range = {
      from: query.range?.from || 1,
      to: query.range?.to || LAST_BLOCK_COUNT,
    };

    const nOpsInBlockRange = (range.to - range.from + 1) * N_OPS_IN_BLOCK;

    // NOTE: simulates a range big enough that contains more than 1000 operations
    if (nOpsInBlockRange > MAX_OPS_IN_BLOCK_RANGE) {
      return HttpResponse.json(
        {
          error:
            "the number of filtered logs exceeds the maximum allowed value of 1000, please use pagination",
        },
        { status: 403 },
      );
    } else {
      return HttpResponse.json<T[]>(Array(nOpsInBlockRange).fill(logItemMock));
    }
  };

const getRangeOfOperationsInterceptor =
  // getOperations :: /logs/transfer
  http.post(`${BASE_URL}/logs/transfer`, getRangeOfOperationsHandler(transferLogMock));

const getRangeOfTokenOperationsInterceptor =
  // getTokenOperations :: /logs/event
  http.post(`${BASE_URL}/logs/event`, getRangeOfOperationsHandler(eventLogMock));

const getFeesInterceptor =
  // getFees :: /transactions/:transactionsID/receipt
  http.get<{ transactionID: string }>(
    `${BASE_URL}/transactions/:transactionID/receipt`,
    async () => {
      return HttpResponse.json({ paid: "30" });
    },
  );

const interceptors = [
  getFeesInterceptor,
  getRangeOfOperationsInterceptor,
  getRangeOfTokenOperationsInterceptor,
];
const server = setupServer(...interceptors);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("sdk", () => {
  describe("getOperations", () => {
    describe("when logged operations are less than 1000 in the given range", () => {
      test("retrieves all the operations", async () => {
        const operations = await getOperations(
          "my-account-id",
          "0xmy-address",
          LAST_BLOCK_COUNT - 332,
          LAST_BLOCK_COUNT,
        );

        expect(operations.length > 0).toBe(true);
        expect(operations.length).toBe(999);
      });
    });

    describe("when logged operations are more than 1000 in the given range", () => {
      test("retrieves all the operations", async () => {
        const operations = await getOperations(
          "my-account-id",
          "0xmy-address",
          LAST_BLOCK_COUNT - 333,
          LAST_BLOCK_COUNT,
        );

        expect(operations.length > 0).toBe(true);
        expect(operations.length).toBe(1002);
      });
    });

    describe("when an unhandled error occurs (anything other than 403 limit reached)", () => {
      beforeEach(() => {
        // getOperations :: /logs/transfer
        server.use(http.post(`${BASE_URL}/logs/transfer`, serverErrorHandler));
      });

      test("rethrows the error", async () => {
        try {
          await getOperations(
            "my-account-id",
            "0xmy-address",
            LAST_BLOCK_COUNT - 5,
            LAST_BLOCK_COUNT,
          );
        } catch (err: unknown) {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const error = err as { message: string };
          expect(error.message).toMatch("something went wrong");
        }

        expect.assertions(1);
      });
    });
  });

  describe("getTokenOperations", () => {
    describe("when logged operations are less than 1000 in the given range", () => {
      test("retrieves all the operations", async () => {
        const operations = await getTokenOperations(
          "my-account-id",
          "0xmy-address",
          "0xmy-token-address",
          LAST_BLOCK_COUNT - 332,
          LAST_BLOCK_COUNT,
        );

        expect(operations.length > 0).toBe(true);
        expect(operations.length).toBe(999);
      });
    });

    describe("when logged operations are more than 1000 in the given range", () => {
      test("retrieves all the operations", async () => {
        const operations = await getTokenOperations(
          "my-account-id",
          "0xmy-address",
          "0xmy-token-address",
          LAST_BLOCK_COUNT - 333,
          LAST_BLOCK_COUNT,
        );

        expect(operations.length > 0).toBe(true);
        expect(operations.length).toBe(1002);
      });
    });

    describe("when an unhandled error occurs (anything other than 403 limit reached)", () => {
      beforeEach(() => {
        // getOperations :: /logs/event
        server.use(http.post(`${BASE_URL}/logs/event`, serverErrorHandler));
      });

      test("rethrows the error", async () => {
        try {
          await getTokenOperations(
            "my-account-id",
            "0xmy-address",
            "0xmy-token-address",
            LAST_BLOCK_COUNT - 5,
            LAST_BLOCK_COUNT,
          );
        } catch (err: unknown) {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const error = err as { message: string };
          expect(error.message).toMatch("something went wrong");
        }

        expect.assertions(1);
      });
    });
  });
});
