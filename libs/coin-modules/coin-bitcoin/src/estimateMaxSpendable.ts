import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import wallet, { getWalletAccount } from "./wallet-btc";
import type { Transaction } from "./types";
import { log } from "@ledgerhq/logs";
import { getRelayFeeFloorSatVb } from "./wallet-btc/utils";

/**
 * Returns the maximum possible amount for transaction
 *
 * @param {Object} param - the account, parentAccount and transaction
 */
export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const walletAccount = getWalletAccount(mainAccount);
  let feePerByte = transaction?.feePerByte;
  if (!feePerByte) {
    const networkInfo = await getAccountNetworkInfo(mainAccount);
    feePerByte = networkInfo.feeItems.defaultFeePerByte;
  }

  const floorSatPerVB = await getRelayFeeFloorSatVb(walletAccount.xpub.explorer);

  // Clamp to ≥ floor + 1 sat/vB; use integer sat/vB for estimation.
  const originalFeeBN = feePerByte!;
  const safeFeeBN = BigNumber.max(originalFeeBN, floorSatPerVB.plus(1)).integerValue(
    BigNumber.ROUND_CEIL,
  );
  if (!safeFeeBN.eq(originalFeeBN)) {
    log(
      "btcwallet",
      `estimateMaxSpendable: feePerByte clamped ${originalFeeBN.toString()} -> ${safeFeeBN.toString()} (floor=${floorSatPerVB.toString()}+1)`,
    );
  }
  const safeFeePerByte = safeFeeBN.toNumber(); // wallet-btc expects number

  const maxSpendable = await wallet.estimateAccountMaxSpendable(
    walletAccount,
    // feePerByte.toNumber(), //!\ wallet-btc handles fees as JS number
    safeFeePerByte, //!\ wallet-btc handles fees as JS number
    transaction?.utxoStrategy?.excludeUTXOs || [],
    transaction ? [transaction.recipient] : [],
    transaction?.opReturnData,
  );

  return maxSpendable.lt(0) ? new BigNumber(0) : maxSpendable;
};

export default estimateMaxSpendable;
