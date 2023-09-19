import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Box, Text } from "@ledgerhq/native-ui";
import { Currency } from "@ledgerhq/types-cryptoassets";

type Props = {
  accountCurrency?: Currency;
};

function ConfirmationHeaderTitle({ accountCurrency }: Props) {
  const { t } = useTranslation();

  return (
    <Box alignItems={"center"} justifyContent={"center"}>
      <Text
        variant={"h5"}
        fontWeight={"semiBold"}
        testID={"deposit-confirmation-title-" + accountCurrency?.ticker}
      >
        {t("transfer.receive.receiveConfirmation.title", {
          currencyTicker: accountCurrency?.ticker,
        })}
      </Text>
      {accountCurrency?.type === "TokenCurrency" && accountCurrency.parentCurrency && (
        <Text color={"neutral.c80"} variant={"small"}>
          {t("transfer.receive.receiveConfirmation.onCurrencyName", {
            currencyName: accountCurrency.parentCurrency.name,
          })}
        </Text>
      )}
    </Box>
  );
}

export default memo<Props>(ConfirmationHeaderTitle);
