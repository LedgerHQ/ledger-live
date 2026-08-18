/* eslint-disable @typescript-eslint/consistent-type-assertions -- test fixtures use partial shapes */
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, Operation } from "@ledgerhq/types-live";
import { extractBalance, extractBalances, transactionToIntent } from "../utils";
import type { GenericTransaction } from "../types";

describe("generic-coin-framework send-max accounts for pending operations", () => {
  const ethereum = getCryptoCurrencyById("ethereum");

  const ONE_ETH = new BigNumber("1000000000000000000");
  const recipient = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const sender = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";

  const FEE = 21_000n * 20_000_000_000n; // 420_000_000_000_000n

  const makeAccount = (pendingOperations: Operation[]): Account =>
    ({
      id: "js:2:ethereum:0xSENDER:",
      type: "Account",
      currency: ethereum,
      freshAddress: sender,
      balance: ONE_ETH,
      spendableBalance: ONE_ETH,
      subAccounts: [],
      pendingOperations,
    }) as unknown as Account;

  const sendMax = (account: Account): bigint => {
    const transaction = {
      mode: "send",
      family: "evm",
      recipient,
      amount: account.spendableBalance,
      useAllAmount: true,
    } as unknown as GenericTransaction;

    const intent = transactionToIntent(account, transaction);
    expect(intent.useAllAmount).toBe(true);
    expect(intent.asset).toMatchObject({ type: "native" });

    const native = extractBalance(extractBalances(account), "native");
    const available = native.value - (native.locked ?? 0n);
    return available - FEE;
  };

  it("offers the full balance minus fees when there is no pending operation", () => {
    const amount = sendMax(makeAccount([]));
    expect(amount).toBe(BigInt(ONE_ETH.toFixed()) - FEE);
  });

  it("subtracts a pending send (amount + its fee) from the send-max amount", () => {
    const pendingAmount = 500_000_000_000_000_000n; // 0.5 ETH already sent
    const pendingOp = {
      id: "pending-out",
      type: "OUT",
      value: new BigNumber(pendingAmount.toString()),
      fee: new BigNumber(FEE.toString()),
      senders: [sender],
      recipients: [recipient],
    } as unknown as Operation;

    const withoutPending = sendMax(makeAccount([]));
    const withPending = sendMax(makeAccount([pendingOp]));

    expect(withPending).toBe(withoutPending - (pendingAmount + FEE));

    const onChainAvailableAfterPending = BigInt(ONE_ETH.toFixed()) - pendingAmount - FEE;
    expect(withPending + FEE).toBeLessThanOrEqual(onChainAvailableAfterPending);
  });
});
