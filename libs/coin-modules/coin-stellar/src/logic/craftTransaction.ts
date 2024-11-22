import {
  Memo,
  Operation as StellarSdkOperation,
  Transaction as StellarSdkTransaction,
  xdr,
} from "@stellar/stellar-sdk";
import { NetworkDown } from "@ledgerhq/errors";
import { getRecipientAccount, loadAccount } from "../network";
import { StellarAssetRequired, StellarMuxedAccountNotExist } from "../types";
import {
  buildChangeTrustOperation,
  buildCreateAccountOperation,
  buildPaymentOperation,
  buildTransactionBuilder,
} from "./sdkWrapper";

export async function craftTransaction(
  account: {
    address: string;
  },
  transaction: {
    type: string;
    recipient: string;
    amount: bigint;
    fee: bigint;
    assetCode?: string | undefined;
    assetIssuer?: string | undefined;
    memoType?: string | null | undefined;
    memoValue?: string | null | undefined;
  },
): Promise<{ transaction: StellarSdkTransaction; xdr: string }> {
  const { amount, recipient, fee, memoType, memoValue, type, assetCode, assetIssuer } = transaction;

  const source = await loadAccount(account.address);

  if (!source) {
    throw new NetworkDown();
  }

  const transactionBuilder = buildTransactionBuilder(source, fee);
  let operation: xdr.Operation<StellarSdkOperation.ChangeTrust> | null = null;

  if (type === "changeTrust") {
    if (!assetCode || !assetIssuer) {
      throw new StellarAssetRequired("");
    }

    operation = buildChangeTrustOperation(assetCode, assetIssuer);
  } else {
    // Payment
    const recipientAccount = await getRecipientAccount({
      recipient,
    });

    if (recipientAccount?.id) {
      operation = buildPaymentOperation({
        destination: recipient,
        amount,
        assetCode,
        assetIssuer,
      });
    } else {
      if (recipientAccount?.isMuxedAccount) {
        throw new StellarMuxedAccountNotExist("");
      }

      operation = buildCreateAccountOperation(recipient, amount);
    }
  }

  transactionBuilder.addOperation(operation);

  const memo = buildMemo(memoType, memoValue);
  if (memo) {
    transactionBuilder.addMemo(memo);
  }

  const craftedTransaction = transactionBuilder.setTimeout(0).build();
  return {
    transaction: craftedTransaction,
    xdr: craftedTransaction.toXDR(),
  };
}

function buildMemo(
  memoType?: string | null | undefined,
  memoValue?: string | null | undefined,
): Memo | null {
  if (memoType && memoValue) {
    switch (memoType) {
      case "MEMO_TEXT":
        return Memo.text(memoValue);
      case "MEMO_ID":
        return Memo.id(memoValue);
      case "MEMO_HASH":
        return Memo.hash(memoValue);
      case "MEMO_RETURN":
        return Memo.return(memoValue);
    }
  }
  return null;
}
