import React from "react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { SwapTransactionStatusOrigin } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import { Box, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useTransactionHeaderViewModel } from "../hooks/useTransactionHeaderViewModel";

type TransactionHeaderProps = Readonly<{
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  createdAt?: number;
  locale: string;
  origin?: SwapTransactionStatusOrigin;
}>;

export function TransactionHeader({
  sendCurrency,
  receiveCurrency,
  createdAt,
  locale,
  origin,
}: TransactionHeaderProps) {
  const { title, currencies, formattedDate } = useTransactionHeaderViewModel({
    sendCurrency,
    receiveCurrency,
    createdAt,
    locale,
    origin,
  });

  return (
    <Box lx={{ alignItems: "center", gap: "s4" }}>
      <Box lx={{ width: "s80", height: "s72" }}>
        {sendCurrency ? (
          <Box lx={{ position: "absolute", left: "s0", top: "s0" }}>
            <CurrencyIcon currency={sendCurrency} size={48} hideNetwork />
          </Box>
        ) : null}
        {receiveCurrency ? (
          <Box lx={{ position: "absolute", right: "s0", top: "s16" }}>
            <CurrencyIcon currency={receiveCurrency} size={48} hideNetwork />
          </Box>
        ) : null}
        {sendCurrency && receiveCurrency ? null : (
          <Skeleton lx={{ height: "s48", width: "s48", borderRadius: "full" }} />
        )}
      </Box>
      {title ? (
        <Text
          testID="swap-transaction-title"
          typography="heading5SemiBold"
          lx={{ color: "base", textAlign: "center" }}
        >
          {title}
        </Text>
      ) : (
        <Skeleton lx={{ height: "s24", width: "s176" }} />
      )}
      {currencies ? (
        <Text
          testID="swap-transaction-currencies"
          typography="heading5SemiBold"
          lx={{ color: "base", textAlign: "center" }}
        >
          {currencies}
        </Text>
      ) : null}
      {formattedDate ? (
        <Text
          testID="swap-transaction-date"
          typography="body3"
          lx={{ color: "muted", textAlign: "center" }}
        >
          {formattedDate}
        </Text>
      ) : (
        <Skeleton lx={{ height: "s16", width: "s144" }} />
      )}
    </Box>
  );
}
