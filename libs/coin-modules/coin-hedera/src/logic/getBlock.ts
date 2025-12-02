import type { AssetInfo } from "@ledgerhq/coin-framework/api/types";
import { getBlockInfo } from "./getBlockInfo";
import { apiClient } from "../network/api";
import {
  HederaBlock,
  HederaBlockTransaction,
  HederaMirrorCoinTransfer,
  HederaMirrorTokenTransfer,
  HederaMirrorTransaction,
} from "../types";
import { getTimestampRangeFromBlockHeight } from "./utils";
import { deduceFees } from "@ledgerhq/coin-framework/api";

export async function getBlock(height: number): Promise<HederaBlock> {
  const { start, end } = getTimestampRangeFromBlockHeight(height);
  const blockInfo = await getBlockInfo(height);
  const transactions = await apiClient.getTransactionsByTimestampRange(start, end);
  return {
    info: blockInfo,
    transactions: transactions.map(toBlockTransaction),
  };
}

function toBlockTransaction(tx: HederaMirrorTransaction): HederaBlockTransaction {
  const payerAccount = tx.transaction_id.split("-")[0];
  const allTransfers = [...tx.transfers, ...tx.token_transfers];

  const operations = allTransfers.map(transfer =>
    toBlockOperation(payerAccount, tx.charged_tx_fee, transfer),
  );

  deduceFees()

  return {
    hash: tx.transaction_hash,
    failed: tx.result !== "SUCCESS",
    operations,
    fees: BigInt(tx.charged_tx_fee),
    feesPayer: payerAccount,
  };
}

function toBlockOperation(
  payerAccount: string,
  chargedFee: number,
  mirrorTransfer: HederaMirrorCoinTransfer | HederaMirrorTokenTransfer,
): BlockOperation {
  const isTokenTransfer = "token_id" in mirrorTransfer;
  const address = mirrorTransfer.account;
  const asset = toHederaAsset(mirrorTransfer);
  let amount = BigInt(mirrorTransfer.amount);

  // exclude fee from payer's operation amount (fees are accounted for separately, so operations must not represent fees)
  if (payerAccount === address && !isTokenTransfer) {
    amount += BigInt(chargedFee);
  }

  return {
    type: "transfer",
    address,
    asset,
    amount,
  };
}

function toHederaAsset(
  mirrorTransfer: HederaMirrorCoinTransfer | HederaMirrorTokenTransfer,
): AssetInfo {
  if ("token_id" in mirrorTransfer) {
    return {
      type: "hts",
      assetReference: mirrorTransfer.token_id,
    };
  }

  return { type: "native" };
}
