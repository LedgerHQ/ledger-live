import {
  CoinSelect,
  DeepFirst,
  Merge,
  type Account as WalletAccount,
  type TransactionInfo as WalletTxInfo,
} from "./wallet-btc";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";

import type { Transaction, UtxoStrategy } from "./types";
import { bitcoinPickingStrategy } from "./types";
import wallet, { getWalletAccount } from "./wallet-btc";
import { log } from "@ledgerhq/logs";
import { Account } from "@ledgerhq/types-live";

const selectUtxoPickingStrategy = (walletAccount: WalletAccount, utxoStrategy: UtxoStrategy) => {
  const handler = {
    [bitcoinPickingStrategy.MERGE_OUTPUTS]: Merge,
    [bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST]: DeepFirst,
    [bitcoinPickingStrategy.OPTIMIZE_SIZE]: CoinSelect,
  }[utxoStrategy.strategy];
  if (!handler) throw new Error("Unsupported Bitcoin UTXO picking strategy");

  return new handler(
    walletAccount.xpub.crypto,
    walletAccount.xpub.derivationMode,
    utxoStrategy.excludeUTXOs,
  );
};

// --- Helpers: BTC/kB → sat/vB (ceil) ---
function btcPerKbToSatPerVB(btcPerKbStr: string): BigNumber {
  // sat/vB = BTC/kB * 1e8 (sat/BTC) / 1000 (vB/kB)
  return new BigNumber(btcPerKbStr).times(1e8).div(1000).integerValue(BigNumber.ROUND_CEIL);
}

export const buildTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<WalletTxInfo> => {
  const { feePerByte, recipient, opReturnData, utxoStrategy } = transaction;

  if (!feePerByte) {
    throw new FeeNotLoaded();
  }

  const walletAccount = getWalletAccount(account);
  const utxoPickingStrategy = selectUtxoPickingStrategy(walletAccount, transaction.utxoStrategy);

  // --- Determine relay floor (sat/vB), prefer explorer.getNetwork(); fallback = 1 sat/vB ---
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
    // ignore network errors; keep default floor = 1 sat/vB
  }

  // --- Clamp user/endpoint fee to ≥ floor + 1 sat/vB, return integer sat/vB ---
  const originalFeeBN = feePerByte;
  const safeFeeBN = BigNumber.max(originalFeeBN, floorSatPerVB.plus(1)).integerValue(
    BigNumber.ROUND_CEIL,
  );
  const safeFeePerByte = safeFeeBN.toNumber(); // wallet-btc expects number
  if (!safeFeeBN.eq(originalFeeBN)) {
    log(
      "btcwallet",
      `buildTransaction: feePerByte clamped ${originalFeeBN.toString()} -> ${safeFeeBN.toString()} (floor=${floorSatPerVB.toString()}+1)`,
    );
  }

  const maxSpendable = await wallet.estimateAccountMaxSpendable(
    walletAccount,
    // feePerByte.toNumber(), //!\ wallet-btc handles fees as JS number
    safeFeePerByte, //!\ wallet-btc handles fees as JS number
    utxoStrategy.excludeUTXOs,
    [recipient],
    opReturnData,
  );

  log("btcwallet", "building transaction", transaction);

  const txInfo = await wallet.buildAccountTx({
    fromAccount: walletAccount,
    dest: transaction.recipient,
    amount: transaction.useAllAmount ? maxSpendable : transaction.amount,
    // feePerByte: feePerByte.toNumber(), //!\ wallet-btc handles fees as JS number
    feePerByte: safeFeePerByte, //!\ wallet-btc handles fees as JS number
    utxoPickingStrategy,
    // Definition of replaceable, per the standard: https://github.com/bitcoin/bips/blob/61ccc84930051e5b4a99926510d0db4a8475a4e6/bip-0125.mediawiki#summary
    sequence: transaction.rbf ? 0 : 0xffffffff,
    opReturnData,
  });

  log("btcwallet", "txInfo", txInfo);

  return txInfo;
};
