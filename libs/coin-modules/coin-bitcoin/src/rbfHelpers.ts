import { BigNumber } from "bignumber.js";
import { Transaction } from "bitcoinjs-lib";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction as BtcTransaction } from "./types";
import { getWalletAccount, Account as WalletAccount } from "./wallet-btc";
import { getIncrementalFeeFloorSatVb } from "./wallet-btc/utils";

const ZERO = new BigNumber(0);
export const RBF_SEQUENCE_THRESHOLD = 0xfffffffe;

export async function getUtxoValue(
  walletAccount: WalletAccount,
  txid: string,
  index: number,
): Promise<number> {
  const rawHex = await walletAccount.xpub.explorer.getTxHex(txid);
  const tx = Transaction.fromHex(rawHex);
  const output = tx.outs[index];
  if (!output) throw new Error(`Output index ${index} does not exist`);
  return output.value; // sats
}

type OriginalTxFeeContext = {
  tx: Transaction;
  vsize: number;
  oldFeeSat: BigNumber;
  oldFeeRateSatVb: BigNumber; // ceil sat/vB
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

  const incrementalFeeRateSatVb = await getIncrementalFeeFloorSatVb(walletAccount.xpub.explorer);

  return { tx, vsize, oldFeeSat, oldFeeRateSatVb, incrementalFeeRateSatVb };
}

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

  return minNewFeeSat.div(vsize).integerValue(BigNumber.ROUND_CEIL);
};
