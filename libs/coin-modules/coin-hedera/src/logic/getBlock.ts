import type {
  AssetInfo,
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/types";
import { getBlockInfo } from "./getBlockInfo";
import { apiClient } from "../network/api";
import type { HederaMirrorCoinTransfer, HederaMirrorTokenTransfer } from "../types";
import { getMemoFromBase64, getTimestampRangeFromBlockHeight } from "./utils";

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

export async function getBlock(height: number): Promise<Block> {
  const { start, end } = getTimestampRangeFromBlockHeight(height);
  const blockInfo = await getBlockInfo(height);
  const transactions = await apiClient.getTransactionsByTimestampRange(start, end);

  const blockTransactions: BlockTransaction[] = transactions.map(tx => {
    const payerAccount = tx.transaction_id.split("-")[0];
    const allTransfers = [...tx.transfers, ...tx.token_transfers];

    const operations = allTransfers.map(transfer =>
      toBlockOperation(payerAccount, tx.charged_tx_fee, transfer),
    );

    return {
      hash: tx.transaction_hash,
      failed: tx.result !== "SUCCESS",
      operations,
      fees: BigInt(tx.charged_tx_fee),
      feesPayer: payerAccount,
      details: { memo: getMemoFromBase64(tx.memo_base64) },
    };
  });

  return {
    info: blockInfo,
    transactions: blockTransactions,
  };
}
