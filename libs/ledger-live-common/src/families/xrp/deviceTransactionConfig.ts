import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";

// app-xrp prints a 40-hex currency code as text when it is printable ASCII padded with zero bytes,
// otherwise as hex (amount.c format_non_standard_currency)
const toDeviceCurrency = (code: string) => {
  if (!/^[0-9A-F]{38}00$/i.test(code)) return code;

  const text = Buffer.from(code, "hex").toString("latin1").replace(/\0+$/, "");

  return /^[\x20-\x7e]+$/.test(text) && !text.includes("XRP") ? text : code;
};

async function getDeviceTransactionConfig({
  transaction: { tag, mode, assetReference, assetOwner },
  status: { amount, estimatedFees },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<CommonDeviceTransactionField>> {
  const fields: Array<CommonDeviceTransactionField> = [];

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  // app-xrp shows the trust line's currency and issuer for a TrustSet
  const hasToken = assetReference && assetOwner;
  if (mode === "changeTrust" && hasToken) {
    fields.push({
      type: "text",
      label: "Currency",
      value: toDeviceCurrency(assetReference),
    });
    fields.push({
      type: "text",
      label: "Issuer",
      value: assetOwner,
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
