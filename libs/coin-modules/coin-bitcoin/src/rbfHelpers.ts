import { BigNumber } from "bignumber.js";
import { Transaction } from "bitcoinjs-lib";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction as BtcTransaction } from "./types";
import { getWalletAccount } from "./wallet-btc/getWalletAccount";
import type { Account as WalletAccount } from "./wallet-btc/account";
import { getIncrementalFeeFloorSatVb } from "./wallet-btc/utils";

const ZERO = new BigNumber(0);
export const RBF_SEQUENCE_THRESHOLD = 0xfffffffe;

/**
 * Returns the set of input outpoints for a tx in "txid-index" format (same as operation.extra.inputs).
 */
export async function getTxInputOutpoints(
  walletAccount: WalletAccount,
  txId: string,
): Promise<Set<string>> {
  const hexTx = await walletAccount.xpub.explorer.getTxHex(txId);
  const tx = Transaction.fromHex(hexTx);
  const out = new Set<string>();
  for (const input of tx.ins) {
    const prevTxId = Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex");
    out.add(`${prevTxId}-${input.index}`);
  }
  return out;
}

export async function getUtxoValue(
  walletAccount: WalletAccount,
  txid: string,
  index: number,
): Promise<number> {
  const rawHex = await walletAccount.xpub.explorer.getTxHex(txid);
  const tx = Transaction.fromHex(rawHex);
  const output = tx.outs[index];
  if (!output) throw new Error(`Output index ${index} does not exist`);
  return output.value;
}

type OriginalTxFeeContext = {
  tx: Transaction;
  vsize: number;
  oldFeeSat: BigNumber;
  oldFeeRateSatVb: BigNumber;
  incrementalFeeRateSatVb: BigNumber;
};

async function getOriginalTxFeeContext(
  walletAccount: WalletAccount,
  originalTxId: string,
): Promise<OriginalTxFeeContext | null> {
  const hexTx = await walletAccount.xpub.explorer.getTxHex(originalTxId);
  const tx = Transaction.fromHex(hexTx);

  const isRbf = tx.ins.some(i => i.sequence < RBF_SEQUENCE_THRESHOLD);
  if (!isRbf) return null;

  const inputValues = await Promise.all(
    tx.ins.map(async input => {
      const txid = Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex");
      return getUtxoValue(walletAccount, txid, input.index);
    }),
  );

  const totalInputSat = inputValues.reduce((a, b) => a + b, 0);
  const totalOutputSat = tx.outs.reduce((a, o) => a + o.value, 0);

  const oldFeeSatNumber = totalInputSat - totalOutputSat;
  if (oldFeeSatNumber < 0) return null;

  const vsize = tx.virtualSize();
  if (!Number.isFinite(vsize) || vsize <= 0) return null;

  const oldFeeSat = new BigNumber(oldFeeSatNumber);
  const oldFeeRateSatVb = oldFeeSat.div(vsize).integerValue(BigNumber.ROUND_CEIL);
  const incrementalFeeRateSatVb = await getIncrementalFeeFloorSatVb(
    walletAccount.xpub.explorer,
    oldFeeRateSatVb,
  );
  return { tx, vsize, oldFeeSat, oldFeeRateSatVb, incrementalFeeRateSatVb };
}

/**
 * Original transaction fee rate (sat/vB). Used when validating RBF replacement
 * and transactionToUpdate.feePerByte is not available (e.g. not stored in operation).
 */
export const getOriginalTxFeeRateSatVb = async (
  account: Account,
  originalTxId: string,
): Promise<BigNumber | null> => {
  try {
    const walletAccount = getWalletAccount(account);
    const ctx = await getOriginalTxFeeContext(walletAccount, originalTxId);
    return ctx ? ctx.oldFeeRateSatVb : null;
  } catch {
    return null;
  }
};

/**
 * Extra fee (in sats) required by common Bitcoin Core RBF policy:
 * - absolute fee increase >= incrementalRelayFee * vsize
 * - feerate increase >= incrementalRelayFee
 *
 * Uses original tx vsize as a proxy for replacement tx vsize.
 */
export const getAdditionalFeeRequiredForRbf = async ({
  mainAccount,
  transactionToUpdate,
}: {
  mainAccount: Account;
  transactionToUpdate: BtcTransaction;
}): Promise<BigNumber> => {
  if (!transactionToUpdate.replaceTxId) return ZERO;

  const walletAccount = getWalletAccount(mainAccount);
  const ctx = await getOriginalTxFeeContext(walletAccount, transactionToUpdate.replaceTxId);
  if (!ctx) return ZERO;

  const { vsize, oldFeeSat, oldFeeRateSatVb, incrementalFeeRateSatVb } = ctx;

  const minNewFeeFromAbsolute = oldFeeSat.plus(
    incrementalFeeRateSatVb.times(vsize).integerValue(BigNumber.ROUND_CEIL),
  );

  const minNewFeeFromRate = oldFeeRateSatVb
    .plus(incrementalFeeRateSatVb)
    .times(vsize)
    .integerValue(BigNumber.ROUND_CEIL);

  const minNewFeeSat = BigNumber.maximum(minNewFeeFromAbsolute, minNewFeeFromRate);
  return BigNumber.maximum(minNewFeeSat.minus(oldFeeSat), ZERO);
};

/**
 * Minimum total fee (in sats) for a replacement tx to beat one specific conflicting tx.
 * RBF requires the replacement to pay strictly more total fee than the original; using
 * only a higher feerate can still yield a lower total fee if the replacement has a
 * smaller vsize (e.g. cancel with fewer outputs). The caller (e.g. wallet.buildAccountTx)
 * must take the max over all conflicting unconfirmed txs so the replacement beats every one.
 */
export const getMinReplacementFeeSat = async (
  walletAccount: WalletAccount,
  originalTxId: string,
): Promise<BigNumber> => {
  const ctx = await getOriginalTxFeeContext(walletAccount, originalTxId);
  if (!ctx) return ZERO;

  const { vsize, oldFeeSat, oldFeeRateSatVb, incrementalFeeRateSatVb } = ctx;

  const minNewFeeFromAbsolute = oldFeeSat.plus(
    incrementalFeeRateSatVb.times(vsize).integerValue(BigNumber.ROUND_CEIL),
  );

  const minNewFeeFromRate = oldFeeRateSatVb
    .plus(incrementalFeeRateSatVb)
    .times(vsize)
    .integerValue(BigNumber.ROUND_CEIL);

  const minNewFeeSat = BigNumber.maximum(minNewFeeFromAbsolute, minNewFeeFromRate);
  // RBF requires new total fee strictly greater than old
  return BigNumber.maximum(minNewFeeSat, oldFeeSat.plus(1));
};

/**
 * Minimum replacement feerate (sat/vB) implied by RBF policy for the original tx.
 * Useful for building a speedup transaction.
 */
export const getMinReplacementFeeRateSatVb = async ({
  account,
  originalTxId,
}: {
  account: Account;
  originalTxId: string;
}): Promise<BigNumber> => {
  const walletAccount = getWalletAccount(account);
  const ctx = await getOriginalTxFeeContext(walletAccount, originalTxId);
  if (!ctx) return ZERO;

  const { vsize, oldFeeSat, oldFeeRateSatVb, incrementalFeeRateSatVb } = ctx;

  const minNewFeeFromAbsolute = oldFeeSat.plus(
    incrementalFeeRateSatVb.times(vsize).integerValue(BigNumber.ROUND_CEIL),
  );

  const minNewFeeFromRate = oldFeeRateSatVb
    .plus(incrementalFeeRateSatVb)
    .times(vsize)
    .integerValue(BigNumber.ROUND_CEIL);

  const minNewFeeSat = BigNumber.maximum(minNewFeeFromAbsolute, minNewFeeFromRate);

  const minFeeRateSatVb = minNewFeeSat.div(vsize).integerValue(BigNumber.ROUND_CEIL);
  // RBF requires new feerate strictly greater than old; ensure we never return <= old (e.g. when incrementalRelayFee is 0)
  return BigNumber.maximum(minFeeRateSatVb, oldFeeRateSatVb.plus(1));
};
