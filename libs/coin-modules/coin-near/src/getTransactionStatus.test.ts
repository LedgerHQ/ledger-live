import BigNumber from "bignumber.js";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./api/node.mock";
import { setCoinConfig } from "./config";
import getTransactionStatus from "./getTransactionStatus";
import { NearAccount, Transaction } from "./types";

describe("getTransactionStatus", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      infra: {
        API_NEAR_PRIVATE_NODE: NEAR_BASE_URL_MOCKED,
        API_NEAR_PUBLIC_NODE: NEAR_BASE_URL_MOCKED,
        API_NEAR_INDEXER: NEAR_BASE_URL_MOCKED,
      },
    }));

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterAll(() => {
    mockServer.close();
  });

  describe("when transaction is a 'send'", () => {
    it("works", async () => {
      // Given
      const account = {
        spendableBalance: new BigNumber(100_000),
        pendingOperations: [],
      } as unknown as NearAccount;
      const transaction = {
        mode: "send",
        amount: new BigNumber(500),
        recipient: "18d68decb70d4d4fd267d19a0d25edc06ad079e69ded41233a10976cf36391ec",
        fees: new BigNumber(10),
      } as Transaction;

      // When
      const result = await getTransactionStatus(account, transaction);

      // Then
      expect(result).toEqual({
        amount: new BigNumber(500),
        errors: {},
        estimatedFees: new BigNumber(10),
        totalSpent: new BigNumber(510),
        warnings: {},
      });
    });
  });
});
