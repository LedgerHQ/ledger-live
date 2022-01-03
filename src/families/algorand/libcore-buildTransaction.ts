import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Account } from "../../types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import type { Core, CoreAccount } from "../../libcore/types";
import type { CoreAlgorandTransaction, AlgorandTransaction } from "./types";
import { extractTokenId } from "./tokens";

const setInfo = async (
  core,
  buildedTransaction,
  transaction,
  subAccount,
  account,
  isPartial
) => {
  const { amount, recipient, assetId, mode, useAllAmount } = transaction;

  if (subAccount || (assetId && mode === "optIn")) {
    const targetAssetId =
      subAccount && subAccount.type === "TokenAccount"
        ? extractTokenId(subAccount.token.id)
        : assetId
        ? extractTokenId(assetId)
        : "";

    if (targetAssetId === "") {
      throw new Error("Token Asset Id not found");
    }

    const asaTransferInfo = await core.AlgorandAssetTransferInfo.init(
      targetAssetId,
      useAllAmount && subAccount
        ? subAccount.balance.toString()
        : amount.toString(),
      recipient,
      null,
      null,
      null
    );
    await buildedTransaction.setAssetTransferInfo(asaTransferInfo);
  } else {
    const paymentinfo = await core.AlgorandPaymentInfo.init(
      recipient,
      useAllAmount
        ? isPartial
          ? account.spendableBalance.toString()
          : account.spendableBalance.minus(transaction.fees || 0).toString()
        : amount.toString(),
      null,
      null
    );
    await buildedTransaction.setPaymentInfo(paymentinfo);
  }
};

export async function algorandBuildTransaction({
  account,
  core,
  coreAccount,
  transaction,
  isCancelled,
  isPartial,
}: {
  account: Account;
  core: Core;
  coreAccount: CoreAccount;
  transaction: AlgorandTransaction;
  isPartial: boolean;
  isCancelled: () => boolean;
}): Promise<CoreAlgorandTransaction | null | undefined> {
  const { fees, memo, subAccountId } = transaction;
  const subAccount = subAccountId
    ? account.subAccounts &&
      account.subAccounts.find((t) => t.id === subAccountId)
    : null;

  if (isPartial === false && !fees) {
    throw new FeeNotLoaded();
  }

  const algorandAccount = await coreAccount.asAlgorandAccount();
  if (isCancelled()) return;
  const buildedTransaction = await algorandAccount.createTransaction();
  if (isCancelled()) return;
  // set Payment or Asset if token
  await setInfo(
    core,
    buildedTransaction,
    transaction,
    subAccount,
    account,
    isPartial
  );

  // Note, maybe not available
  if (memo) {
    await buildedTransaction.setNote(memo);
  }

  // if Partial getEstimateFees here
  const feesToSet = isPartial
    ? await libcoreAmountToBigNumber(
        await algorandAccount.getFeeEstimate(buildedTransaction)
      )
    : fees;

  // then setFees here in any case
  if (feesToSet) {
    await buildedTransaction.setFee(feesToSet.toString());
  }

  // return transaction
  return buildedTransaction;
}
export default algorandBuildTransaction;
