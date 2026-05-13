import React from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Box, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useTranslation } from "~/context/Locale";
import { formatCreatedAt } from "./utils";

type TransactionHeaderProps = {
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  createdAt?: number;
  locale: string;
};

export function TransactionHeader({
  sendCurrency,
  receiveCurrency,
  createdAt,
  locale,
}: TransactionHeaderProps) {
  const { t } = useTranslation();
  const hasCurrencies = sendCurrency && receiveCurrency;

  return (
    <Box lx={{ alignItems: "center", gap: "s12" }}>
      <Box lx={{ width: "s80", height: "s64" }}>
        {sendCurrency ? (
          <Box lx={{ position: "absolute", left: "s0", top: "s0" }}>
            <CurrencyIcon currency={sendCurrency} size={48} />
          </Box>
        ) : null}
        {receiveCurrency ? (
          <Box lx={{ position: "absolute", right: "s0", top: "s8" }}>
            <CurrencyIcon currency={receiveCurrency} size={48} />
          </Box>
        ) : null}
        {!hasCurrencies ? (
          <Skeleton lx={{ height: "s48", width: "s48", borderRadius: "full" }} />
        ) : null}
      </Box>
      {hasCurrencies ? (
        <Text typography="heading5SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("transfer.swap2.modals.transactionStatus.title", {
            sendTicker: sendCurrency.ticker,
            receiveTicker: receiveCurrency.ticker,
          })}
        </Text>
      ) : (
        <Skeleton lx={{ height: "s24", width: "s176" }} />
      )}
      {createdAt ? (
        <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
          {formatCreatedAt(createdAt, locale)}
        </Text>
      ) : (
        <Skeleton lx={{ height: "s16", width: "s144" }} />
      )}
    </Box>
  );
}
