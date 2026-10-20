import React, { memo } from "react";
import { useWindowDimensions } from "react-native";
import { useTranslation } from "~/context/Locale";
import { Box, Text } from "@ledgerhq/native-ui";
import { Currency } from "@domain/entity-currency";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";

export const CONFIRMATION_HEADER_SIDE_WIDTH = 88;
const HEADER_HORIZONTAL_MARGIN = 16;

type Props = {
  accountCurrency?: Currency;
};

function ConfirmationHeaderTitle({ accountCurrency }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const networkName =
    accountCurrency?.type === "TokenCurrency"
      ? findCryptoCurrencyById(accountCurrency.parentCurrencyId)?.name
      : accountCurrency?.name;

  return (
    <Box
      alignItems={"center"}
      justifyContent={"center"}
      maxWidth={width - 2 * (CONFIRMATION_HEADER_SIDE_WIDTH + HEADER_HORIZONTAL_MARGIN)}
    >
      <Text
        variant={"h5"}
        fontWeight={"semiBold"}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        testID={"receive-confirmation-title-" + accountCurrency?.ticker}
      >
        {t("transfer.receive.receiveConfirmation.title", {
          currencyTicker: accountCurrency?.ticker,
        })}
      </Text>
      {networkName && (
        <Text color={"neutral.c80"} variant={"small"} numberOfLines={1}>
          {t("transfer.receive.receiveConfirmation.onCurrencyName", {
            currencyName: networkName,
          })}
        </Text>
      )}
    </Box>
  );
}

export default memo<Props>(ConfirmationHeaderTitle);
