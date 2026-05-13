import React from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { formatCreatedAt } from "./utils";

interface TransactionHeaderProps {
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  createdAt?: number;
  locale: string;
}

export function TransactionHeader({
  sendCurrency,
  receiveCurrency,
  createdAt,
  locale,
}: TransactionHeaderProps) {
  const { t } = useTranslation();
  const hasCurrencies = sendCurrency && receiveCurrency;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[56px] w-[80px] mb-24">
        {sendCurrency ? (
          <div className="absolute left-0 top-0">
            <CryptoCurrencyIcon currency={sendCurrency} size={48} />
          </div>
        ) : null}
        {receiveCurrency ? (
          <div className="absolute right-0 top-16">
            <CryptoCurrencyIcon currency={receiveCurrency} size={48} />
          </div>
        ) : null}
        {!hasCurrencies ? <Skeleton className="size-48 rounded-full" /> : null}
      </div>
      {hasCurrencies ? (
        <h2 className="heading-4-semi-bold text-base">
          {t("swap2.modals.transactionStatus.title", {
            sendTicker: sendCurrency.ticker,
            receiveTicker: receiveCurrency.ticker,
          })}
        </h2>
      ) : (
        <Skeleton className="h-24 w-176 rounded-sm" />
      )}
      {createdAt ? (
        <p className="body-2 text-muted">{formatCreatedAt(createdAt, locale)}</p>
      ) : (
        <Skeleton className="mt-8 h-16 w-144 rounded-sm" />
      )}
    </div>
  );
}
