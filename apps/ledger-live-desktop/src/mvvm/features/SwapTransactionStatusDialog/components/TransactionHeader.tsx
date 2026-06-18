import React from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import { formatCreatedAt } from "../utils";

type TransactionHeaderProps = Readonly<{
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  createdAt?: number;
  locale: string;
}>;

function HeaderCurrencyIcon({
  currency,
  size,
}: Readonly<{ currency: CryptoOrTokenCurrency; size: number }>) {
  return (
    <CryptoIcon
      ledgerId={currency.id}
      ticker={currency.ticker}
      size={getValidCryptoIconSize(size)}
    />
  );
}

export function TransactionHeader({
  sendCurrency,
  receiveCurrency,
  createdAt,
  locale,
}: TransactionHeaderProps) {
  const { t } = useTranslation();
  const hasCurrencies = sendCurrency !== undefined && receiveCurrency !== undefined;

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-24" style={{ height: 56, width: 80 }}>
        {sendCurrency ? (
          <div className="absolute left-0 top-0">
            <HeaderCurrencyIcon currency={sendCurrency} size={48} />
          </div>
        ) : null}
        {receiveCurrency ? (
          <div className="absolute right-0 top-16">
            <HeaderCurrencyIcon currency={receiveCurrency} size={48} />
          </div>
        ) : null}
        {hasCurrencies ? null : <Skeleton className="size-48 rounded-full" />}
      </div>
      {hasCurrencies ? (
        <h2 data-testid="swap-transaction-title" className="heading-4-semi-bold text-base">
          {t("swap2.modals.transactionStatus.title", {
            sendTicker: sendCurrency.ticker,
            receiveTicker: receiveCurrency.ticker,
          })}
        </h2>
      ) : (
        <Skeleton className="h-24 w-176 rounded-sm" />
      )}
      {createdAt ? (
        <p data-testid="swap-transaction-date" className="body-2 text-muted">
          {formatCreatedAt(createdAt, locale)}
        </p>
      ) : (
        <Skeleton className="mt-8 h-16 w-176 rounded-sm" />
      )}
    </div>
  );
}
