import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import { getMainAccount } from "../../account";
import { getTokenFromAsset } from "./bridge/api";
import type { Transaction, TransactionStatus } from "./types";

const ZERO_PADDED_ASCII = /^[\x20-\x7e]+\0+$/;

// A 40-hex currency code as app-xrp prints it, as text or as hex:
// https://github.com/LedgerHQ/app-xrp/blob/a7efd903001bb41fd8df242a428bcf3abc07a72f/src/xrp/amount.c#L228-L247
function toDeviceCurrency(hexCode: string): string {
  const bytes = Buffer.from(hexCode, "hex").toString("latin1");

  const isText = ZERO_PADDED_ASCII.test(bytes) && !bytes.includes("XRP");

  return isText ? bytes.replace(/\0+$/, "") : hexCode;
}

function formatTokenAmount(token: TokenCurrency, amount: BigNumber): string {
  return formatCurrencyUnit(token.units[0], amount, { showCode: true, disableRounding: true });
}

async function getIouToken(
  account: AccountLike,
  parentAccount: Account | null | undefined,
  { assetReference, assetOwner }: Transaction,
): Promise<TokenCurrency | undefined> {
  if (!assetReference || !assetOwner) return undefined;

  const { currency } = getMainAccount(account, parentAccount);

  const token = await getTokenFromAsset(currency, { assetReference, assetOwner, type: "token" });

  return token?.tokenType === "iou" ? token : undefined;
}

async function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
  status: { amount, totalSpent, estimatedFees },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<CommonDeviceTransactionField>> {
  const fields: Array<CommonDeviceTransactionField> = [];
  const iouToken = await getIouToken(account, parentAccount, transaction);

  if (typeof transaction.tag === "number") {
    fields.push({
      type: "text",
      label: "Tag",
      value: String(transaction.tag),
    });
  }

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (iouToken) {
    if (transaction.mode === "changeTrust") {
      fields.push({
        type: "text",
        label: "Limit Amount",
        value: formatTokenAmount(iouToken, transaction.amount),
      });
    }

    const { tokenIdentifier = "" } = iouToken;
    // app-xrp prints a 3-character code within the amount, and a 40-hex one in its own row
    const isHexCode = tokenIdentifier.length !== 3;

    if (isHexCode) {
      fields.push({
        type: "text",
        label: "Currency",
        value: toDeviceCurrency(tokenIdentifier),
      });
    }

    fields.push({
      type: "text",
      label: "Issuer",
      value: iouToken.contractAddress,
    });
  }

  if (!estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  const isTokenSend = iouToken && transaction.mode !== "changeTrust";

  if (isTokenSend && !totalSpent.eq(amount)) {
    fields.push({
      type: "text",
      label: "Send Max",
      value: formatTokenAmount(iouToken, totalSpent),
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
