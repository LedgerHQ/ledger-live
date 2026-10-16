import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import {
  bitcoinPickingStrategy,
  type BitcoinAccount,
  type Transaction as BtcTransaction,
  type UtxoStrategy,
} from "../types";
import { bitcoinDisplayAddress } from "@ledgerhq/coin-bitcoin/api";
import {
  bitcoinWritePortfolioOf,
  getNextChangeAddress,
  getOwnDisplayAddresses,
  type BitcoinWritePortfolio,
} from "../accountModule/account";
import { getReplacementEstimate } from "./replacement";

type Output = { address: string | null; value: bigint };

/** What the replaced transaction sends out of the account, and to whom. */
async function amountAndRecipient(
  account: BitcoinAccount,
  outputs: Output[],
  knownRecipient: string | undefined,
  opened: BitcoinWritePortfolio | null,
): Promise<{ amountSent: bigint; recipient: string }> {
  const show = (address: string) => bitcoinDisplayAddress(account.currency.id, address);
  if (knownRecipient) {
    const output = outputs.find(o => o.address && show(o.address) === knownRecipient);
    if (output) return { amountSent: output.value, recipient: knownRecipient };
  }
  const own = await getOwnDisplayAddresses(account, opened);
  const external = outputs.filter(o => o.address && !own.has(show(o.address)));
  if (external.length === 0) return { amountSent: 0n, recipient: "" };
  return {
    amountSent: external.reduce((sum, o) => sum + o.value, 0n),
    recipient: show(external[0].address as string),
  };
}

/** Pending change can not be spent by the replacement of the transaction that creates it. */
const excludePendingChange = (account: BitcoinAccount): UtxoStrategy["excludeUTXOs"] =>
  (account.bitcoinResources?.utxos ?? [])
    .filter(u => !u.blockHeight && u.isChange)
    .map(u => ({ hash: u.hash, outputIndex: u.outputIndex }));

async function buildReplacement(
  account: Account,
  originalTxId: string,
  kind: "speedup" | "cancel",
): Promise<BtcTransaction> {
  const bitcoinAccount = account as BitcoinAccount;
  // The account's portfolio when it serves it, opened once for the reads of this replacement.
  const opened = await bitcoinWritePortfolioOf(account);
  const parameters = await getReplacementEstimate(account, originalTxId, opened);
  const change = await getNextChangeAddress(bitcoinAccount, opened);
  const knownRecipient = account.pendingOperations.find(op => op.hash === originalTxId)
    ?.recipients?.[0];
  const outputs = parameters.replacedOutputs ?? [];
  const { amountSent, recipient } = await amountAndRecipient(
    bitcoinAccount,
    outputs,
    knownRecipient,
    opened,
  );

  // Not only what replaces it, but not below the network either, or the replacement is stuck too.
  const fast = new BigNumber((parameters.feeRates?.fast ?? 0n).toString());
  const feePerByte = BigNumber.max(
    new BigNumber((parameters.minReplacementFeePerByte ?? 0n).toString()),
    fast,
  ).integerValue(BigNumber.ROUND_CEIL);
  const isFast = feePerByte.isEqualTo(fast);

  // A cancel of a cancel has no external output: it keeps the first output's amount.
  const amount =
    kind === "cancel" && amountSent === 0n
      ? (outputs.find(o => o.value > 0n)?.value ?? 0n)
      : amountSent;

  return {
    family: "bitcoin",
    mode: "send",
    amount: new BigNumber(amount.toString()),
    recipient: kind === "cancel" ? change.address : recipient,
    useAllAmount: false,
    feesStrategy: isFast ? "fast" : "custom",
    familySpecificData: {
      utxoStrategy: {
        strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
        excludeUTXOs: excludePendingChange(bitcoinAccount),
      },
      rbf: true,
      replaceTxId: originalTxId,
      changeAddress: change.address,
      ...(isFast ? {} : { feePerByte: feePerByte.toFixed() }),
    },
  };
}

export const buildRbfSpeedUpTx = (
  account: Account,
  originalTxId: string,
): Promise<BtcTransaction> => buildReplacement(account, originalTxId, "speedup");

/** Sends the funds back to the account's change address instead of the original recipient. */
export const buildRbfCancelTx = (account: Account, originalTxId: string): Promise<BtcTransaction> =>
  buildReplacement(account, originalTxId, "cancel");
