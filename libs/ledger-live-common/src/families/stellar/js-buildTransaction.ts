import invariant from "invariant";
import StellarSdk from "stellar-sdk";
import { AmountRequired, FeeNotLoaded, NetworkDown } from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import {
  buildPaymentOperation,
  buildCreateAccountOperation,
  buildTransactionBuilder,
  buildChangeTrustOperation,
  loadAccount,
} from "./api";
import { getRecipientAccount, getAmountValue } from "./logic";
import { StellarAssetRequired, StellarMuxedAccountNotExist } from "../../errors";

/**
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<any> => {
  const { recipient, networkInfo, fees, memoType, memoValue, mode, assetCode, assetIssuer } =
    transaction;

  if (!fees) {
    throw new FeeNotLoaded();
  }

  const source = await loadAccount(account.freshAddress);

  if (!source) {
    throw new NetworkDown();
  }

  invariant(networkInfo && networkInfo.family === "stellar", "stellar family");

  const transactionBuilder = buildTransactionBuilder(source, fees);
  let operation = null;

  if (mode === "changeTrust") {
    if (!assetCode || !assetIssuer) {
      throw new StellarAssetRequired("");
    }

    operation = buildChangeTrustOperation(assetCode, assetIssuer);
  } else {
    // Payment
    const amount = getAmountValue(account, transaction, fees);

    if (!amount) {
      throw new AmountRequired();
    }

    const recipientAccount = await getRecipientAccount({
      account,
      recipient: transaction.recipient,
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

  let memo = null;

  if (memoType && memoValue) {
    switch (memoType) {
      case "MEMO_TEXT":
        memo = StellarSdk.Memo.text(memoValue);
        break;

      case "MEMO_ID":
        memo = StellarSdk.Memo.id(memoValue);
        break;

      case "MEMO_HASH":
        memo = StellarSdk.Memo.hash(memoValue);
        break;

      case "MEMO_RETURN":
        memo = StellarSdk.Memo.return(memoValue);
        break;
    }
  }

  if (memo) {
    transactionBuilder.addMemo(memo);
  }

  const built = transactionBuilder.setTimeout(0).build();
  return built;
};
export default buildTransaction;
