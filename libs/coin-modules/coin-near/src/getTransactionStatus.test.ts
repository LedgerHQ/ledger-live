import BigNumber from "bignumber.js";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./network/node.mock";
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
        API_NEARBLOCKS_INDEXER: NEAR_BASE_URL_MOCKED,
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

  // Regression test for LIVE-36138: withdrawing unstaked NEAR with a spendable balance below the
  // gas cost silently succeeded in LWD ≤4.15.0 because the fee formula divided by 10. The fee is
  // now the full prepaid-gas amount, so validation must block the flow before signing.
  describe("when transaction is a 'withdraw'", () => {
    const validatorId = "pool.near";
    // 1 NEAR available to withdraw from the pool (funds come from the pool, not the liquid balance)
    const availableInPool = new BigNumber("1000000000000000000000000");

    const makeAccount = (spendableBalance: BigNumber): NearAccount =>
      ({
        spendableBalance,
        pendingOperations: [],
        nearResources: {
          stakingPositions: [
            {
              validatorId,
              staked: new BigNumber(0),
              available: availableInPool,
              pending: new BigNumber(0),
            },
          ],
        },
      }) as unknown as NearAccount;

    const makeTransaction = (fees: BigNumber): Transaction =>
      ({
        mode: "withdraw",
        amount: availableInPool,
        recipient: validatorId,
        fees,
        useAllAmount: false,
      }) as Transaction;

    it("returns NotEnoughBalance when spendable balance is below the gas fee (LIVE-36138)", async () => {
      // The real-world case from the bug: 0.063 NEAR spendable, ~0.2 NEAR gas fee.
      const spendable = new BigNumber("63000000000000000000000"); // 0.063 NEAR
      const gasFee = new BigNumber("200000000000000000000000"); // 0.2 NEAR (200 TGas × gas_price)

      const result = await getTransactionStatus(makeAccount(spendable), makeTransaction(gasFee));

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("has no balance error when spendable balance covers the gas fee", async () => {
      const spendable = new BigNumber("500000000000000000000000"); // 0.5 NEAR
      const gasFee = new BigNumber("200000000000000000000000"); // 0.2 NEAR

      const result = await getTransactionStatus(makeAccount(spendable), makeTransaction(gasFee));

      expect(result.errors.amount).toBeUndefined();
    });
  });
});
