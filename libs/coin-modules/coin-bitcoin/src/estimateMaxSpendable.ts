import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import wallet, { getWalletAccount } from "./wallet-btc";
import type { Transaction } from "./types";
import { log } from "@ledgerhq/logs";

// BTC/kB → sat/vB (ceil)
function btcPerKbToSatPerVB(btcPerKbStr: string): BigNumber {
  return new BigNumber(btcPerKbStr).times(1e8).div(1000).integerValue(BigNumber.ROUND_CEIL);
}

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

  // Determine relay floor (sat/vB). Prefer explorer.getNetwork(); fallback = 1 sat/vB.
  let floorSatPerVB = new BigNumber(1);
  try {
    const explorerAny = walletAccount.xpub.explorer as any;
    if (typeof explorerAny.getNetwork === "function") {
      const net = await explorerAny.getNetwork();
      if (net?.relay_fee) {
        const rel = btcPerKbToSatPerVB(net.relay_fee);
        if (rel.isFinite() && rel.gte(0)) {
          floorSatPerVB = BigNumber.max(rel, 1);
        }
      }
    }
  } catch {
    // ignore, keep default floor
  }

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
