import React, { memo } from "react";
import { useTranslation } from "~/context/Locale";
import { Box, Text } from "@ledgerhq/native-ui";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";

type Props = {
  accountCurrency?: Currency;
};

function ConfirmationHeaderTitle({ accountCurrency }: Props) {
  const { t } = useTranslation();
  const networkName =
    accountCurrency?.type === "TokenCurrency"
      ? findCryptoCurrencyById(accountCurrency.parentCurrencyId)?.name
      : accountCurrency?.name;

  return (
    <Box alignItems={"center"} justifyContent={"center"}>
      <Text
        variant={"h5"}
        fontWeight={"semiBold"}
        testID={"receive-confirmation-title-" + accountCurrency?.ticker}
      >
        {t("transfer.receive.receiveConfirmation.title", {
          currencyTicker: accountCurrency?.ticker,
        })}
      </Text>
      {networkName && (
        <Text color={"neutral.c80"} variant={"small"}>
          {t("transfer.receive.receiveConfirmation.onCurrencyName", {
            currencyName: networkName,
          })}
        </Text>
      )}
    </Box>
  );
}

export default memo<Props>(ConfirmationHeaderTitle);
