/* eslint-disable @typescript-eslint/consistent-type-assertions -- test fixtures use partial shapes */
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { validateIntent } from "@ledgerhq/coin-evm/logic/index";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import { extractBalances, transactionToIntent } from "../utils";
import type { GenericTransaction } from "../types";

/**
 * Integration test for the "send max uses a stale balance while a previous send
 * is still pending" bug.
 *
 * Unlike the unit tests in utils.test.ts (which check extractBalances in
 * isolation) this wires together the *real* production functions across both
 * packages: ledger-live-common's `extractBalances` + `transactionToIntent` feed
 * coin-evm's real `validateIntent` (which runs `computeAmount`). Only the
 * network seam is removed by passing pre-computed `customFees` (and a legacy tx
 * type so the gas tracker is never queried), keeping the test deterministic
 * while exercising the logic under test end to end.
 */
describe("[integration] EVM send-max accounts for pending operations", () => {
  const ethereum = getCryptoCurrencyById("ethereum");

  // 1 ETH balance, fully spendable, no chain reserve.
  const ONE_ETH = new BigNumber("1000000000000000000");
  const recipient = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  // Legacy fee: 21000 gas * 20 gwei = 0.00042 ETH.
  const GAS_LIMIT = 21_000n;
  const GAS_PRICE = 20_000_000_000n;
  const FEE = GAS_LIMIT * GAS_PRICE; // 420_000_000_000_000n

  const customFees: FeeEstimation = {
    value: FEE,
    parameters: { gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE },
  };

  const computeIntentType = (tx: GenericTransaction) =>
    tx.type === 2 ? "send-eip1559" : "send-legacy";
  const craftTransactionData = () => ({ type: "buffer" as const, value: Buffer.alloc(0) });

  const makeAccount = (pendingOperations: Operation[]): Account =>
    ({
      id: "js:2:ethereum:0xSENDER:",
      type: "Account",
      currency: ethereum,
      freshAddress: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
      balance: ONE_ETH,
      spendableBalance: ONE_ETH,
      subAccounts: [],
      pendingOperations,
    }) as unknown as Account;

  const computeSendMaxAmount = async (account: Account): Promise<bigint> => {
    const transaction = {
      mode: "send",
      family: "evm",
      recipient,
      amount: account.spendableBalance,
      useAllAmount: true,
    } as unknown as GenericTransaction;

    const intent = transactionToIntent(account, transaction, computeIntentType, craftTransactionData);
    const { amount } = await validateIntent(
      ethereum,
      intent as Parameters<typeof validateIntent>[1],
      extractBalances(account),
      customFees,
    );
    return amount;
  };

  it("offers the full balance minus fees when there is no pending operation", async () => {
    const amount = await computeSendMaxAmount(makeAccount([]));
    // 1 ETH - fee
    expect(amount).toBe(BigInt(ONE_ETH.toFixed()) - FEE);
  });

  it("subtracts a pending send (amount + its fee) from the send-max amount", async () => {
    const pendingAmount = 500_000_000_000_000_000n; // 0.5 ETH already sent
    const pendingOp = {
      id: "pending-out",
      type: "OUT",
      value: new BigNumber(pendingAmount.toString()),
      fee: new BigNumber(FEE.toString()),
      senders: ["0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"],
      recipients: [recipient],
    } as unknown as Operation;

    const withoutPending = await computeSendMaxAmount(makeAccount([]));
    const withPending = await computeSendMaxAmount(makeAccount([pendingOp]));

    // The committed funds (pending value + pending fee) are removed from send-max.
    expect(withPending).toBe(withoutPending - (pendingAmount + FEE));

    // And critically: the new send-max never exceeds what will actually be
    // available on-chain once the pending tx is mined.
    const onChainAvailableAfterPending = BigInt(ONE_ETH.toFixed()) - pendingAmount - FEE;
    expect(withPending + FEE).toBeLessThanOrEqual(onChainAvailableAfterPending);
  });
});
