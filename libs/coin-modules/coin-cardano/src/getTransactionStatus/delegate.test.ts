import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { buildTransaction } from "../buildTransaction";
import coinConfig from "../config";
import {
  CardanoInvalidPoolId,
  CardanoNotEnoughFunds,
  CardanoStakeKeyDepositError,
} from "../errors";
import { getCardanoAccountFixture } from "../fixtures/accounts";
import { cardanoCoinConfig, cardanoTestnetCoinConfig } from "../fixtures/config";
import { getDelegationFixture } from "../fixtures/delegation";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import type { Transaction } from "../types";
import { getDelegateTransactionStatus } from "./delegate";

jest.mock("../buildTransaction", () => {
  const actual = jest.requireActual("../buildTransaction");
  return { ...actual, buildTransaction: jest.fn(actual.buildTransaction) };
});

const mockedBuildTransaction = jest.mocked(buildTransaction);

const VALID_POOL_ID = "a".repeat(56);
const FEES = new BigNumber(180_000);

const buildDelegateTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  family: "cardano",
  recipient: "",
  amount: new BigNumber(0),
  fees: FEES,
  mode: "delegate",
  poolId: VALID_POOL_ID,
  protocolParams: getProtocolParamsFixture(),
  ...overrides,
});

const buildAccount = ({ registered }: { registered: boolean }) => {
  const account = getCardanoAccountFixture({
    delegation: registered ? getDelegationFixture() : undefined,
  });
  account.cardanoResources.protocolParams = getProtocolParamsFixture();
  account.spendableBalance = new BigNumber(100e6);
  return account;
};

describe("getDelegateTransactionStatus", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(currencyId =>
      currencyId === "cardano_testnet" ? cardanoTestnetCoinConfig : cardanoCoinConfig,
    );
  });

  beforeEach(() => {
    mockedBuildTransaction.mockClear();
  });

  it.each([
    ["an empty pool id", ""],
    ["a non hexadecimal pool id", "z".repeat(56)],
    ["a too short pool id", "a".repeat(55)],
    ["a too long pool id", "a".repeat(57)],
  ])("reports CardanoInvalidPoolId for %s", async (_name, poolId) => {
    const status = await getDelegateTransactionStatus(
      buildAccount({ registered: true }),
      buildDelegateTransaction({ poolId }),
    );

    expect(status.errors.poolId).toBeInstanceOf(CardanoInvalidPoolId);
  });

  it("does not build the transaction when the pool id is invalid", async () => {
    await getDelegateTransactionStatus(
      buildAccount({ registered: true }),
      buildDelegateTransaction({ poolId: "invalid" }),
    );

    expect(mockedBuildTransaction).not.toHaveBeenCalled();
  });

  it("reports no error for a valid pool id on a registered stake key", async () => {
    const status = await getDelegateTransactionStatus(
      buildAccount({ registered: true }),
      buildDelegateTransaction(),
    );

    expect({
      errors: status.errors,
      warnings: status.warnings,
      amount: status.amount.toString(),
      estimatedFees: status.estimatedFees.toString(),
      totalSpent: status.totalSpent.toString(),
    }).toEqual({
      errors: {},
      warnings: {},
      amount: "0",
      estimatedFees: "180000",
      totalSpent: "180000",
    });
  });

  it("requires the fees to be loaded", async () => {
    const status = await getDelegateTransactionStatus(
      buildAccount({ registered: true }),
      buildDelegateTransaction({ fees: undefined }),
    );

    expect(status.errors.fees).toBeInstanceOf(FeeNotLoaded);
  });

  it.each([
    "Not enough ADA",
    "Not enough tokens",
    "Tx size limit reached, try spending lesser ADA/Tokens",
  ])("maps the recoverable build error %p to CardanoNotEnoughFunds", async message => {
    mockedBuildTransaction.mockRejectedValueOnce(new Error(message));

    const status = await getDelegateTransactionStatus(
      buildAccount({ registered: true }),
      buildDelegateTransaction(),
    );

    expect(status.errors.amount).toBeInstanceOf(CardanoNotEnoughFunds);
  });

  it("re-throws unexpected build errors", async () => {
    mockedBuildTransaction.mockRejectedValueOnce(new Error("Unexpected programming error"));

    await expect(
      getDelegateTransactionStatus(buildAccount({ registered: true }), buildDelegateTransaction()),
    ).rejects.toThrow("Unexpected programming error");
  });

  it("reports CardanoStakeKeyDepositError when the stake key is not registered and the balance cannot pay the deposit", async () => {
    const account = buildAccount({ registered: false });
    account.spendableBalance = new BigNumber(1e6);

    const status = await getDelegateTransactionStatus(account, buildDelegateTransaction());

    expect(status.errors.amount).toBeInstanceOf(CardanoStakeKeyDepositError);
  });

  it("does not require a deposit when the stake key is already registered", async () => {
    const account = buildAccount({ registered: true });
    account.spendableBalance = new BigNumber(1e6);

    const status = await getDelegateTransactionStatus(account, buildDelegateTransaction());

    expect(status.errors.amount).toBeUndefined();
  });
});
