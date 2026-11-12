import { getOptOutReview } from "@ledgerhq/coin-xrp/logic-public";
import type { OptOutFlag } from "@ledgerhq/coin-xrp/logic-public";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import { getStandardFromReference, isIouHexCode } from "./tokenReference";
import type { Transaction, TransactionStatus } from "./types";

const OPT_OUT_FLAG_LABELS: Record<OptOutFlag, string> = {
  setNoRipple: "Set No Ripple",
  clearNoRipple: "Clear No Ripple",
  clearFreeze: "Clear Freeze",
};

type DeviceTransactionConfigInput = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
};

// Listed in the order the device asks for them. The MPT fields are LIVE-39154's.
async function getOptOutFields(
  input: DeviceTransactionConfigInput,
): Promise<Array<CommonDeviceTransactionField>> {
  const { account, parentAccount } = input;
  const { assetReference, assetOwner } = input.transaction;
  const fees: CommonDeviceTransactionField = { type: "fees", label: "Fees" };

  const isMissingToken = !assetReference || !assetOwner;
  const isIou = !isMissingToken && getStandardFromReference(assetReference) === "iou";
  if (!isIou) return [fees];

  const { currency, freshAddress } = getMainAccount(account, parentAccount);

  const asset = { assetReference, assetOwner, type: "iou" };

  const review = await getOptOutReview(buildContext(currency.id), freshAddress, asset);

  const fields: Array<CommonDeviceTransactionField> = review.flags.map(flag => {
    return { type: "text", label: "Flags", value: OPT_OUT_FLAG_LABELS[flag] };
  });

  if (review.resetsQualityIn) {
    fields.push({ type: "text", label: "Quality In", value: "0" });
  }

  if (review.resetsQualityOut) {
    fields.push({ type: "text", label: "Quality Out", value: "0" });
  }

  fields.push({ type: "text", label: "Limit Amount", value: "0" });

  if (isIouHexCode(assetReference)) {
    fields.push({ type: "text", label: "Currency", value: assetReference });
  }

  fields.push({ type: "text", label: "Issuer", value: assetOwner }, fees);

  return fields;
}

async function getDeviceTransactionConfig(
  input: DeviceTransactionConfigInput,
): Promise<Array<CommonDeviceTransactionField>> {
  const { tag, mode } = input.transaction;
  const { amount, estimatedFees } = input.status;

  if (mode === "optOut") return getOptOutFields(input);

  const fields: Array<CommonDeviceTransactionField> = [];

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (!estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  if (typeof tag === "number") {
    fields.push({
      type: "text",
      label: "Tag",
      value: String(tag),
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
