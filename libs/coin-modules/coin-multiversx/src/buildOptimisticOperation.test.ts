import BigNumber from "bignumber.js";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { MultiversXAccount, MultiversXProtocolTransaction, Transaction } from "./types";

describe("buildOptimisticOperation", () => {
  it("should work with mode = send", async () => {
    const account = {
      freshAddress: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    } as MultiversXAccount;

    const transaction = {
      family: "multiversx",
      mode: "send",
      fees: new BigNumber("1"),
      amount: new BigNumber("42"),
      recipient: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
    } as Transaction;

    const notSignedTransaction: MultiversXProtocolTransaction = {
      nonce: 7,
    } as MultiversXProtocolTransaction;

    const operation = buildOptimisticOperation(account, transaction, notSignedTransaction);

    expect(operation.type).toEqual("OUT");
    expect(operation.value).toEqual(new BigNumber("43"));
    expect(operation.fee).toEqual(new BigNumber("1"));
    expect(operation.extra).toEqual({
      amount: new BigNumber("0"),
    });
  });

  it("should work with mode = delegate", async () => {
    const account = {
      freshAddress: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    } as MultiversXAccount;

    const transaction = {
      family: "multiversx",
      mode: "delegate",
      fees: new BigNumber("1"),
      amount: new BigNumber("42"),
      recipient: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy",
      data: "delegate",
    } as Transaction;

    const notSignedTransaction: MultiversXProtocolTransaction = {
      nonce: 7,
    } as MultiversXProtocolTransaction;

    const operation = buildOptimisticOperation(account, transaction, notSignedTransaction);

    expect(operation.type).toEqual("DELEGATE");
    expect(operation.value).toEqual(new BigNumber("43"));
    expect(operation.fee).toEqual(new BigNumber("1"));
    expect(operation.extra).toEqual({
      amount: new BigNumber("42"),
    });
  });

  it("should work with mode = claimRewards", async () => {
    const account = {
      freshAddress: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    } as MultiversXAccount;

    const transaction = {
      family: "multiversx",
      mode: "claimRewards",
      fees: new BigNumber("1"),
      amount: new BigNumber("42"),
      recipient: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy",
      data: "claimRewards",
    } as Transaction;

    const notSignedTransaction: MultiversXProtocolTransaction = {
      nonce: 7,
    } as MultiversXProtocolTransaction;

    const operation = buildOptimisticOperation(account, transaction, notSignedTransaction);

    expect(operation.type).toEqual("REWARD");
    expect(operation.value).toEqual(new BigNumber("1"));
    expect(operation.fee).toEqual(new BigNumber("1"));
    expect(operation.extra).toEqual({
      amount: new BigNumber("0"),
    });
  });
});
