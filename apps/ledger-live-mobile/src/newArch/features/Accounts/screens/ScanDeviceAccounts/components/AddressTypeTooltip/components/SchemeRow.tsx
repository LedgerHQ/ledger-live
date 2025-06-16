import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useTranslation } from "react-i18next";

type SchemeRowProps = {
  scheme: string;
  currency: CryptoCurrency;
};

const SchemeRow = ({ scheme, currency }: SchemeRowProps) => {
  const { t } = useTranslation();

  return (
    <Flex marginY={16}>
      <Text variant="large" fontWeight="semiBold">
        {t(`addAccounts.addressTypeInfo.${scheme}.title`)}
      </Text>
      <Text variant="body" color="neutral.c70">
        {t(`addAccounts.addressTypeInfo.${scheme}.desc`, {
          currency: currency.name,
        })}
      </Text>
    </Flex>
  );
};

export default SchemeRow;
