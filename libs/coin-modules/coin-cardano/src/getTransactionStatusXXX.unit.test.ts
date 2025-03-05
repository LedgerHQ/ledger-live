import BigNumber from "bignumber.js";
import { getTransactionStatus } from "./getTransactionStatusXXX";
import { CardanoAccount, Transaction } from "./types";

describe("getTransactionStatus", () => {
  it("should return not enough funds error when there are no utxos", async () => {
    const initialAccount = {
      pendingOperations: [],
      cardanoResources: {
        utxos: [],
      },
    } as unknown as CardanoAccount;

    const sendTx: Transaction = {
      amount: new BigNumber(1000000),
      recipient:
        "addr1qxqm3nxwzf70ke9jqa2zrtrevjznpv6yykptxnv34perjc8a7zgxmpv5pgk4hhhe0m9kfnlsf5pt7d2ahkxaul2zygrq3nura9",
      mode: "send",
      family: "cardano",
      poolId: undefined,
    };
    const sendTxRes = await getTransactionStatus(initialAccount, sendTx);
    expect(sendTxRes.errors.amount.name).toBe("CardanoNotEnoughFunds");

    const delegateTx: Transaction = {
      amount: new BigNumber(0),
      recipient: "",
      mode: "delegate",
      family: "cardano",
      poolId: "d0f48f07e4e5eb8040a988085f7ea3bd32d71a2e2998d53e9bbc959a",
    };
    const delegateTxRes = await getTransactionStatus(initialAccount, delegateTx);
    expect(delegateTxRes.errors.amount.name).toBe("CardanoNotEnoughFunds");

    const undelegateTx: Transaction = {
      amount: new BigNumber(0),
      recipient: "",
      mode: "undelegate",
      family: "cardano",
      poolId: undefined,
    };
    const undelegateTxRes = await getTransactionStatus(initialAccount, undelegateTx);
    expect(undelegateTxRes.errors.amount.name).toBe("CardanoNotEnoughFunds");
  });
});
