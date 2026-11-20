import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { CardanoMinAmountError } from "../errors";
import { getCardanoAccountFixture } from "../fixtures/accounts";
import { cardanoTestnetCoinConfig, cardanoCoinConfig } from "../fixtures/config";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import coinConfig from "../config";
import type { Transaction } from "../types";
import { getSendTransactionStatus } from "./send";

const RECIPIENT =
  "addr_test1qz7jw975stagnvs00wsjny6y6gpazn86yvwcm2vy02j3up7mt68vuzvz4nzgs00x0shrgywvy674v6r2zcs8fxvvq27qfjq8np";
const FEES = new BigNumber(170_000);

const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  family: "cardano",
  recipient: RECIPIENT,
  amount: new BigNumber(2e6),
  fees: FEES,
  mode: "send",
  poolId: undefined,
  protocolParams: getProtocolParamsFixture(),
  ...overrides,
});

const buildAccount = () => {
  const account = getCardanoAccountFixture({});
  account.balance = new BigNumber(100e6);
  account.spendableBalance = new BigNumber(100e6);
  account.cardanoResources.protocolParams = getProtocolParamsFixture();
  return account;
};

describe("getSendTransactionStatus (real transaction builder)", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(currencyId =>
      currencyId === "cardano_testnet" ? cardanoTestnetCoinConfig : cardanoCoinConfig,
    );
  });

  it("reports no error for a send above the minimum amount", async () => {
    const status = await getSendTransactionStatus(buildAccount(), buildTransaction());

    expect({
      errors: status.errors,
      amount: status.amount.toString(),
      totalSpent: status.totalSpent.toString(),
    }).toEqual({ errors: {}, amount: "2000000", totalSpent: "2170000" });
  });

  it("requires a recipient", async () => {
    const status = await getSendTransactionStatus(
      buildAccount(),
      buildTransaction({ recipient: "", amount: new BigNumber(0) }),
    );

    expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("rejects an invalid address", async () => {
    const status = await getSendTransactionStatus(
      buildAccount(),
      buildTransaction({ recipient: "invalidADDRESS", amount: new BigNumber(0) }),
    );

    expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("requires an amount", async () => {
    const status = await getSendTransactionStatus(
      buildAccount(),
      buildTransaction({ amount: new BigNumber(0) }),
    );

    expect(status.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("requires the fees to be loaded", async () => {
    const status = await getSendTransactionStatus(
      buildAccount(),
      buildTransaction({ fees: undefined }),
    );

    expect(status.errors.fees).toBeInstanceOf(FeeNotLoaded);
  });

  it("reports CardanoMinAmountError for an amount below the minimum utxo amount", async () => {
    const status = await getSendTransactionStatus(
      buildAccount(),
      buildTransaction({ amount: new BigNumber(0.1e6) }),
    );

    expect({
      name: status.errors.amount?.name,
      isMinAmountError: status.errors.amount instanceof CardanoMinAmountError,
      amount: status.amount.toString(),
    }).toEqual({ name: "CardanoMinAmountError", isMinAmountError: true, amount: "100000" });
  });

  it("reports NotEnoughBalance when the amount exceeds the spendable balance", async () => {
    const status = await getSendTransactionStatus(
      buildAccount(),
      buildTransaction({ amount: new BigNumber(100e6) }),
    );

    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("reports a send max leaving the fees without error", async () => {
    const status = await getSendTransactionStatus(
      buildAccount(),
      buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
    );

    expect({
      errors: status.errors,
      amountIsPositive: status.amount.gt(0),
      amountWithinBalance: status.amount.lt(100e6),
    }).toEqual({ errors: {}, amountIsPositive: true, amountWithinBalance: true });
  });
});
