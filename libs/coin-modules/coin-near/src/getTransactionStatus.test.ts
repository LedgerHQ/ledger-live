import BigNumber from "bignumber.js";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./network/node.mock";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { setCoinConfig } from "./config";
import { NearStakingThresholdNotMet, NearUseAllAmountStakeWarning } from "./errors";
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

  // LIVE-36138: withdrawing with a liquid balance below the gas cost silently succeeded in
  // LWD <=4.15.0 because the fee formula divided by 10, so validation has to block before signing.
  // It then blocked too much: the fee was priced against a balance that also excludes
  // MIN_ACCOUNT_BALANCE_BUFFER, our own reserve, which the protocol lets a withdraw spend.
  describe("when transaction is a 'withdraw'", () => {
    const validatorId = "pool.near";
    // 1 NEAR available to withdraw from the pool (funds come from the pool, not the liquid balance)
    const availableInPool = new BigNumber("1000000000000000000000000");
    const storageDeposit = new BigNumber("1820000000000000000000"); // 182 bytes x 1e19
    const reserve = new BigNumber("50000000000000000000000"); // MIN_ACCOUNT_BALANCE_BUFFER

    // `liquidBalance` is what the account holds on chain, storage deposit included.
    const makeAccount = (liquidBalance: BigNumber): NearAccount =>
      ({
        balance: liquidBalance.plus(availableInPool),
        spendableBalance: BigNumber.max(
          liquidBalance.minus(storageDeposit).minus(reserve),
          new BigNumber(0),
        ),
        pendingOperations: [],
        nearResources: {
          stakedBalance: new BigNumber(0),
          availableBalance: availableInPool,
          pendingBalance: new BigNumber(0),
          storageUsageBalance: storageDeposit.plus(reserve),
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

    it("blocks the withdraw when the liquid balance is below the gas fee (LIVE-36138)", async () => {
      const liquidBalance = new BigNumber("63000000000000000000000"); // 0.063 NEAR
      const gasFee = new BigNumber("200000000000000000000000"); // 0.2 NEAR (200 TGas x gas_price)

      const result = await getTransactionStatus(
        makeAccount(liquidBalance),
        makeTransaction(gasFee),
      );

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("allows the withdraw when only our reserve stands between the fee and the balance", async () => {
      // 0.055 NEAR liquid: under 0.02 once the reserve is taken out, over it once only the
      // storage deposit is.
      const liquidBalance = new BigNumber("55000000000000000000000");
      const gasFee = new BigNumber("20000000000000000000000"); // 0.02 NEAR

      const account = makeAccount(liquidBalance);
      const result = await getTransactionStatus(account, makeTransaction(gasFee));

      expect(account.spendableBalance.lt(gasFee)).toBe(true);
      expect(result.errors.amount).toBeUndefined();
    });

    it("has no balance error when the liquid balance comfortably covers the gas fee", async () => {
      const liquidBalance = new BigNumber("500000000000000000000000"); // 0.5 NEAR
      const gasFee = new BigNumber("200000000000000000000000"); // 0.2 NEAR

      const result = await getTransactionStatus(
        makeAccount(liquidBalance),
        makeTransaction(gasFee),
      );

      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("when transaction is a 'stake'", () => {
    const validatorId = "pool.near";
    const gasFee = new BigNumber("55000000000000000000000"); // 55 TGas at the 1e9 floor

    const makeAccount = (spendableBalance: BigNumber): NearAccount =>
      ({
        spendableBalance,
        pendingOperations: [],
        nearResources: { stakingPositions: [] },
      }) as unknown as NearAccount;

    it("warns when staking the whole spendable balance", async () => {
      const transaction = {
        mode: "stake",
        recipient: validatorId,
        amount: new BigNumber(0),
        useAllAmount: true,
        fees: gasFee,
      } as Transaction;

      const result = await getTransactionStatus(
        makeAccount(new BigNumber("1000000000000000000000000")),
        transaction,
      );

      expect(result.errors).toEqual({});
      expect(result.warnings.amount).toBeInstanceOf(NearUseAllAmountStakeWarning);
    });

    it("rejects an amount below the staking threshold once the fee is covered", async () => {
      const transaction = {
        mode: "stake",
        recipient: validatorId,
        amount: new BigNumber(1),
        useAllAmount: false,
        fees: gasFee,
      } as Transaction;

      const result = await getTransactionStatus(
        makeAccount(new BigNumber("1000000000000000000000000")),
        transaction,
      );

      expect(result.errors.amount).toBeInstanceOf(NearStakingThresholdNotMet);
    });

    it("keeps the minimum-balance reserve out of reach of a stake", async () => {
      // 0.015 NEAR spendable, as the integration seed account has, cannot buy 55 TGas at the
      // floor even though the liquid balance above the storage deposit could.
      const transaction = {
        mode: "stake",
        recipient: validatorId,
        amount: new BigNumber("100000000"),
        useAllAmount: false,
        fees: gasFee,
      } as Transaction;

      const result = await getTransactionStatus(
        makeAccount(new BigNumber("15332000000000000000000")),
        transaction,
      );

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });
});
