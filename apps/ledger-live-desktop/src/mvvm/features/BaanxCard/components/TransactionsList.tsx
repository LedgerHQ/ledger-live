import React from "react";
import { useTranslation } from "react-i18next";
import type {
  BaanxTransaction,
  BaanxTransactionFilters,
} from "@ledgerhq/baanx";
import { Divider } from "@ledgerhq/lumen-ui-react";

interface Props {
  readonly data: BaanxTransaction[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly filters: BaanxTransactionFilters;
  readonly onFiltersChange: (filters: BaanxTransactionFilters) => void;
}

function formatAmount(sign: string, amount: string, currency: string): string {
  const prefix = sign === "DEBIT" ? "-" : "+";
  return `${prefix}${amount} ${currency.toUpperCase()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function txStatusStyle(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "text-success";
    case "PENDING":
      return "text-warning";
    case "DECLINED":
      return "text-error";
    case "REVERTED":
      return "text-muted";
    default:
      return "text-base";
  }
}

export function TransactionsList({ data, isLoading, error, filters, onFiltersChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-16">
      <div className="flex items-center justify-between">
        <span className="heading-3-semi-bold text-base">
          {t("baanxCard.transactions.title")}
        </span>
        <div className="flex gap-8">
          <input
            type="text"
            value={filters.searchKey ?? ""}
            onChange={e => onFiltersChange({ ...filters, searchKey: e.target.value || undefined })}
            placeholder={t("baanxCard.transactions.search")}
            className="rounded-sm border border-default bg-surface px-8 py-4 text-sm text-base outline-none placeholder:text-muted focus:border-primary"
            data-testid="baanx-tx-search"
          />
        </div>
      </div>

      <div className="rounded-md bg-surface">
        {isLoading && (
          <div className="flex h-32 items-center justify-center">
            <span className="body-2 text-muted">{t("baanxCard.transactions.loading")}</span>
          </div>
        )}

        {error && (
          <div className="flex h-32 items-center justify-center">
            <span className="body-2 text-error">{t("baanxCard.transactions.error")}</span>
          </div>
        )}

        {!isLoading && !error && data.length === 0 && (
          <div className="flex h-32 items-center justify-center">
            <span className="body-2 text-muted">{t("baanxCard.transactions.empty")}</span>
          </div>
        )}

        {data.map((tx, index) => (
          <React.Fragment key={tx.id}>
            {index > 0 && <Divider />}
            <div
              className="flex items-center justify-between px-16 py-12"
              data-testid={`baanx-tx-row-${tx.id}`}
            >
              <div className="flex flex-col gap-2">
                <span className="body-2-semi-bold text-base">{tx.merchantNameLocation}</span>
                <div className="flex gap-8">
                  <span className="body-3 text-muted">{formatDate(tx.dateTime)}</span>
                  <span className="body-3 text-muted">·</span>
                  <span className="body-3 text-muted">{tx.mccCategory}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`body-2-semi-bold ${tx.sign === "DEBIT" ? "text-base" : "text-success"}`}>
                  {formatAmount(tx.sign, tx.amountInTransactionCurrency, tx.transactionCurrency)}
                </span>
                <span className={`body-3 ${txStatusStyle(tx.status)}`}>{tx.status}</span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {data.length > 0 && (
        <div className="flex justify-center gap-8">
          <button
            type="button"
            className="body-3 text-primary hover:underline disabled:text-muted disabled:no-underline"
            disabled={(filters.page ?? 0) === 0}
            onClick={() => onFiltersChange({ ...filters, page: (filters.page ?? 0) - 1 })}
          >
            {t("baanxCard.transactions.previous")}
          </button>
          <span className="body-3 text-muted">
            {t("baanxCard.transactions.page", { page: (filters.page ?? 0) + 1 })}
          </span>
          <button
            type="button"
            className="body-3 text-primary hover:underline"
            onClick={() => onFiltersChange({ ...filters, page: (filters.page ?? 0) + 1 })}
          >
            {t("baanxCard.transactions.next")}
          </button>
        </div>
      )}
    </div>
  );
}
