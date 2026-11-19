import BigNumber from "bignumber.js";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./network/node.mock";
import { http, HttpResponse } from "msw";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { setCoinConfig } from "./config";
import {
  NearActivationFeeNotCovered,
  NearNewAccountWarning,
  NearNewNamedAccountError,
  NearNotEnoughAvailable,
  NearNotEnoughStaked,
  NearRecommendUnstake,
  NearStakingThresholdNotMet,
  NearUseAllAmountStakeWarning,
} from "./errors";
import getTransactionStatus from "./getTransactionStatus";
import { NearAccount, Transaction } from "./types";

const SELF = "18d68decb70d4d4fd267d19a0d25edc06ad079e69ded41233a10976cf36391ec";
const ACTIVE_RECIPIENT = "3cfb4df771c29cf040e2534b71b4df08b6232e7248aefc7decf45d2b40f80ad5";
const INACTIVE = "6cbf3b0f8d8b4667bf64bf44b4fefa830e4cef0e5da1e5cfb4015b5a755c4ac0";

const makeSendAccount = (overrides: Partial<NearAccount> = {}): NearAccount =>
  ({
    freshAddress: SELF,
    spendableBalance: new BigNumber("10000000000000000000000"),
    pendingOperations: [],
    currency: { name: "NEAR" },
    ...overrides,
  }) as unknown as NearAccount;

const makeSendTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    mode: "send",
    recipient: ACTIVE_RECIPIENT,
    amount: new BigNumber(500),
    useAllAmount: false,
    fees: new BigNumber(10),
    ...overrides,
  }) as Transaction;

const unknownAccountOnNode = () =>
  mockServer.use(
    http.post(NEAR_BASE_URL_MOCKED, () => {
      return HttpResponse.json({});
    }),
  );

describe("getTransactionStatus", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      name: "NEAR",
      unit: { name: "NEAR", code: "NEAR", magnitude: 24 },
      infra: {
        API_NEAR_PRIVATE_NODE: NEAR_BASE_URL_MOCKED,
        API_NEAR_PUBLIC_NODE: NEAR_BASE_URL_MOCKED,
        API_NEAR_INDEXER: NEAR_BASE_URL_MOCKED,
        API_NEARBLOCKS_INDEXER: NEAR_BASE_URL_MOCKED,
      },
    }));

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    mockServer.resetHandlers();
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

    it("warns when the recipient is the sender", async () => {
      const result = await getTransactionStatus(
        makeSendAccount(),
        makeSendTransaction({ recipient: SELF, amount: new BigNumber("100000000") }),
      );

      expect(result.warnings.recipient).toBeInstanceOf(
        InvalidAddressBecauseDestinationIsAlsoSource,
      );
      expect(result.errors).toEqual({});
      expect(result.amount).toEqual(new BigNumber("100000000"));
    });

    it("rejects an amount above the spendable balance", async () => {
      const result = await getTransactionStatus(
        makeSendAccount(),
        makeSendTransaction({ amount: new BigNumber("1000000000000000000000000") }),
      );

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("warns that an unknown implicit recipient will be created by the transfer", async () => {
      unknownAccountOnNode();

      const result = await getTransactionStatus(
        makeSendAccount(),
        makeSendTransaction({
          recipient: INACTIVE,
          amount: new BigNumber("2000000000000000000000"),
        }),
      );

      expect(result.warnings.recipient).toBeInstanceOf(NearNewAccountWarning);
      expect(result.errors).toEqual({});
    });

    it("rejects an unknown named recipient", async () => {
      unknownAccountOnNode();

      const result = await getTransactionStatus(
        makeSendAccount(),
        makeSendTransaction({
          recipient: "brand-new-account-8172987103.near",
          amount: new BigNumber("2000000000000000000000"),
        }),
      );

      expect(result.errors.recipient).toBeInstanceOf(NearNewNamedAccountError);
      expect(result.errors.amount).toBeUndefined();
    });

    it("rejects an amount too small to activate an unknown implicit recipient", async () => {
      unknownAccountOnNode();

      const result = await getTransactionStatus(
        makeSendAccount(),
        makeSendTransaction({ recipient: INACTIVE, amount: new BigNumber("100000000") }),
      );

      expect(result.errors.amount).toBeInstanceOf(NearActivationFeeNotCovered);
    });

    it("recommends unstaking first when sending everything with an open position", async () => {
      const result = await getTransactionStatus(
        makeSendAccount({
          nearResources: {
            stakingPositions: [
              {
                validatorId: "pool.near",
                staked: new BigNumber(1),
                available: new BigNumber(0),
                pending: new BigNumber(0),
              },
            ],
          },
        } as unknown as Partial<NearAccount>),
        makeSendTransaction({ amount: new BigNumber(0), useAllAmount: true }),
      );

      expect(result.warnings.amount).toBeInstanceOf(NearRecommendUnstake);
    });

    it.each([
      ["", RecipientRequired],
      ["not a valid address!", InvalidAddress],
    ])("returns an error for the recipient %p", async (recipient, expectedError) => {
      const result = await getTransactionStatus(
        makeSendAccount(),
        makeSendTransaction({ recipient }),
      );

      expect(result.errors.recipient).toBeInstanceOf(expectedError);
    });

    it("requires an amount", async () => {
      const result = await getTransactionStatus(
        makeSendAccount(),
        makeSendTransaction({ amount: new BigNumber(0) }),
      );

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });
  });

  describe("when transaction is an 'unstake'", () => {
    const makeUnstakeAccount = (staked: BigNumber): NearAccount =>
      ({
        spendableBalance: new BigNumber("1000000000000000000000000"),
        pendingOperations: [],
        nearResources: {
          stakingPositions: [
            {
              validatorId: "pool.near",
              staked,
              available: new BigNumber(0),
              pending: new BigNumber(0),
            },
          ],
        },
      }) as unknown as NearAccount;

    const makeUnstakeTransaction = (amount: BigNumber): Transaction =>
      ({
        mode: "unstake",
        recipient: "pool.near",
        amount,
        useAllAmount: false,
        fees: new BigNumber(10),
      }) as Transaction;

    it("rejects an amount below the staking threshold", async () => {
      const result = await getTransactionStatus(
        makeUnstakeAccount(new BigNumber(0)),
        makeUnstakeTransaction(new BigNumber(1)),
      );

      expect(result.errors.amount).toBeInstanceOf(NearStakingThresholdNotMet);
    });

    it("rejects unstaking more than is staked", async () => {
      const result = await getTransactionStatus(
        makeUnstakeAccount(new BigNumber("500000000000000000000000")),
        makeUnstakeTransaction(new BigNumber("1000000000000000000000000")),
      );

      expect(result.errors.amount).toBeInstanceOf(NearNotEnoughStaked);
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

    it("rejects withdrawing more than is available", async () => {
      const liquidBalance = new BigNumber("500000000000000000000000");
      const gasFee = new BigNumber("200000000000000000000000");

      const result = await getTransactionStatus(makeAccount(liquidBalance), {
        ...makeTransaction(gasFee),
        amount: availableInPool.multipliedBy(2),
      });

      expect(result.errors.amount).toBeInstanceOf(NearNotEnoughAvailable);
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

    it("rejects staking everything when the spendable balance cannot cover the fee", async () => {
      const transaction = {
        mode: "stake",
        recipient: validatorId,
        amount: new BigNumber("100000000"),
        useAllAmount: true,
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
