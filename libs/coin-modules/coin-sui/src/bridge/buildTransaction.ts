import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import type { DeviceModelId } from "@ledgerhq/devices";
import { craftTransaction } from "../logic";
import { DEFAULT_COIN_TYPE, toSuiAsset } from "../network/sdk";
import getResolution from "../signer/getResolution";
import type { SuiAccount, Transaction } from "../types";

/**
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const buildTransaction = async (
  account: SuiAccount,
  transaction: Transaction,
  withObjects?: boolean,
  deviceModelId?: DeviceModelId,
  certificateSignatureKind?: "prod" | "test",
) => {
  const {
    amount,
    mode,
    recipient,
    subAccountId,
    useAllAmount = false,
    stakedSuiId = "",
  } = transaction;
  const { freshAddress } = account;
  const subAccount = findSubAccountById(account, subAccountId ?? "");
  const asset = toSuiAsset(subAccount?.token.contractAddress ?? DEFAULT_COIN_TYPE);
  const resolution = getResolution(transaction, deviceModelId, certificateSignatureKind);

  return craftTransaction(
    {
      intentType: "transaction",
      amount: BigInt(amount.toString()),
      asset,
      recipient,
      sender: freshAddress,
      type: mode,
      useAllAmount,
      stakedSuiId,
    },
    withObjects,
    resolution,
  );
};
