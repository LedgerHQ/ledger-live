import type BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { getAssetFromToken, getStandardFromReference, IOU_HEX_CODE } from "./bridge/api";
import type { Transaction, TransactionStatus } from "./types";

const IOU_MAGNITUDE = 38;

/**
 * As app-xrp prints a 40-hex code: as text when it is printable ASCII padded with zero bytes and
 * holds no "XRP", else as lowercase hex (`src/xrp/amount.c` `format_non_standard_currency`)
 */
export function toDeviceCurrency(code: string): string {
  const bytes = Buffer.from(code, "hex");
  const hex = code.toLowerCase();

  const text = bytes.toString("latin1").replace(/\0+$/, "");
  const endsWithZero = bytes.at(-1) === 0;
  const isPrintable = /^[\x20-\x7e]+$/.test(text);
  const hasXrp = text.includes("XRP");
  if (!endsWithZero || hasXrp) return hex;

  return isPrintable ? text : hex;
}

// As app-xrp prints an IOU amount: no grouping, and a 3-character code first
function toDeviceIouAmount(baseUnits: BigNumber, code: string): string {
  const value = baseUnits.shiftedBy(-IOU_MAGNITUDE).toFixed();

  return IOU_HEX_CODE.test(code) ? value : `${code} ${value}`;
}

function toIouAsset(assetReference: string | undefined, assetOwner: string | undefined) {
  if (!assetReference || !assetOwner) return undefined;

  return getStandardFromReference(assetReference) === "iou"
    ? { assetReference, assetOwner }
    : undefined;
}

function getIouAsset(account: AccountLike, transaction: Transaction) {
  if (transaction.mode === "changeTrust") {
    return toIouAsset(transaction.assetReference, transaction.assetOwner);
  }

  if (account.type !== "TokenAccount") {
    return undefined;
  }

  const asset = getAssetFromToken(account.token);
  if (!asset || !("assetReference" in asset)) return undefined;

  return toIouAsset(asset.assetReference, asset.assetOwner);
}

function getIouAssetFields(code: string, issuer: string): CommonDeviceTransactionField[] {
  const currencyFields: CommonDeviceTransactionField[] = IOU_HEX_CODE.test(code)
    ? [{ type: "text", label: "Currency", value: toDeviceCurrency(code) }]
    : [];

  return [...currencyFields, { type: "address", label: "Issuer", address: issuer }];
}

async function getDeviceTransactionConfig({
  account,
  transaction,
  status,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<CommonDeviceTransactionField>> {
  const amountFields: CommonDeviceTransactionField[] = status.amount.isZero()
    ? []
    : [{ type: "amount", label: "Amount" }];

  const feesFields: CommonDeviceTransactionField[] = status.estimatedFees.isZero()
    ? []
    : [{ type: "fees", label: "Fees" }];

  const tagFields: CommonDeviceTransactionField[] =
    typeof transaction.tag === "number"
      ? [{ type: "text", label: "Tag", value: String(transaction.tag) }]
      : [];

  const iou = getIouAsset(account, transaction);
  if (!iou) return [...amountFields, ...feesFields, ...tagFields];

  const assetFields = getIouAssetFields(iou.assetReference, iou.assetOwner);

  if (transaction.mode === "changeTrust") {
    const flags = transaction.noRipple === false ? "Clear No Ripple" : "Set No Ripple";
    const limit = toDeviceIouAmount(transaction.amount, iou.assetReference);

    return [
      { type: "text", label: "Flags", value: flags },
      { type: "text", label: "Limit Amount", value: limit },
      ...assetFields,
      ...feesFields,
    ];
  }

  const sendMaxFields: CommonDeviceTransactionField[] =
    account.type === "TokenAccount" && !status.totalSpent.eq(status.amount)
      ? [
          {
            type: "text",
            label: "Send Max",
            value: formatCurrencyUnit(account.token.units[0], status.totalSpent, {
              showCode: true,
              disableRounding: true,
            }),
          },
        ]
      : [];

  return [...amountFields, ...assetFields, ...sendMaxFields, ...tagFields, ...feesFields];
}

export default getDeviceTransactionConfig;
