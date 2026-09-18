import React, { useState } from "react";
import { useTranslation } from "@shared/i18n";
import type {
  CardTransactionFormatters,
  CardTransactionItem,
} from "@features/flow-pay-card-transactions";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { CardAssetDetailsDialog } from "./CardAssetDetailsDialog.web";
import type { CardAssetRow } from "./types";

// ponytail: QA preview only. It opens the asset details dialog on mount with a fixed USDC wallet, so
// the design can be reviewed before the host passes `assets` to the flow. Reload the Pay tab to
// reopen it once closed. Delete this file and its mount in `@features/flow-pay-card` once a real row
// click reaches the dialog.
const PREVIEW_ASSET: CardAssetRow = {
  id: "preview-usdc",
  currency: "usdc",
  network: "ethereum",
  name: "USD Coin",
  ticker: "USDC",
  ledgerId: "ethereum/erc20/usd__coin",
  cryptoAmount: "4,000.00 USDC",
  countervalue: "$4,000.00",
  countervalueAmount: 4000,
};

const PREVIEW_TRANSACTIONS: readonly CardTransactionItem[] = [
  {
    transaction: {
      id: "preview-uniqlo",
      panLast4: "9189",
      transactionId: "1122334477422",
      dateTime: "2026-09-18T12:32:00.000Z",
      sign: "DEBIT",
      merchantNameLocation: "UNIQLO, PARIS",
      mccCategory: "MISC",
      status: "CONFIRMED",
      declineReason: "",
      transactionCurrency: "USD",
      amountInTransactionCurrency: "324.43",
      feesInTransactionCurrency: "0",
      originalCurrency: "EUR",
      amountInOriginalCurrency: "299.99",
      fundingSources: [{ currency: "usdc", amount: "324.4332", sign: "DEBIT" }],
    },
    categoryLabel: "Other",
  },
  {
    transaction: {
      id: "preview-dentist",
      panLast4: "9189",
      transactionId: "1122334477423",
      dateTime: "2026-09-18T11:43:00.000Z",
      sign: "DEBIT",
      merchantNameLocation: "DENTIST, PARIS",
      mccCategory: "HEALTH",
      status: "CONFIRMED",
      declineReason: "",
      transactionCurrency: "USD",
      amountInTransactionCurrency: "434.22",
      feesInTransactionCurrency: "0",
      originalCurrency: "USD",
      amountInOriginalCurrency: "434.22",
      fundingSources: [
        { currency: "usdc", amount: "200.00", sign: "DEBIT" },
        { currency: "btc", amount: "0.00231", sign: "DEBIT" },
      ],
    },
    categoryLabel: "Health",
  },
  {
    transaction: {
      id: "preview-topup",
      panLast4: "9189",
      transactionId: "1122334477424",
      dateTime: "2026-09-17T09:05:00.000Z",
      sign: "CREDIT",
      merchantNameLocation: "TOP UP",
      mccCategory: "MISC",
      status: "CONFIRMED",
      declineReason: "",
      transactionCurrency: "USD",
      amountInTransactionCurrency: "1000.00",
      feesInTransactionCurrency: "0",
      originalCurrency: "USD",
      amountInOriginalCurrency: "1000.00",
      fundingSources: [{ currency: "usdc", amount: "1000.00", sign: "CREDIT" }],
    },
    categoryLabel: "Other",
  },
];

const KEY_PREFIX = "payTab.card.assets";

export function CardAssetDetailsDialogPreview({
  formatBalance,
  formatters,
}: Readonly<{
  formatBalance?: (value: number) => FormattedValue;
  formatters?: CardTransactionFormatters;
}>) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <CardAssetDetailsDialog
      isOpen={isOpen}
      asset={PREVIEW_ASSET}
      transactions={PREVIEW_TRANSACTIONS}
      copy={{
        topUp: t(`${KEY_PREFIX}.details.topUp`),
        withdraw: t(`${KEY_PREFIX}.details.withdraw`),
        transactions: t(`${KEY_PREFIX}.details.transactions`),
        withdrawTitle: t(`${KEY_PREFIX}.withdraw.title`),
        withdrawDescription: t(`${KEY_PREFIX}.withdraw.description`),
        continue: t(`${KEY_PREFIX}.withdraw.continue`),
      }}
      formatBalance={formatBalance}
      formatters={formatters}
      onClose={() => setIsOpen(false)}
      onTopUp={() => setIsOpen(false)}
      onWithdraw={() => setIsOpen(false)}
      onShowHistory={() => setIsOpen(false)}
    />
  );
}
