import { Flex, Text, ProgressPoint } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useSelector } from "react-redux";
import { counterValueFormatter } from "LLM/features/Market/utils";
import { useLocale } from "~/context/Locale";

type PerformanceProps = {
  low: number;
  high: number;
  price: number;
};

export const Performance: React.FC<PerformanceProps> = ({ low, high, price }) => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  return (
    <Flex width="100%">
      <Text fontWeight="bold" fontSize={14} paddingBottom={6}>
        {t("largeMover.performance")}
      </Text>
      <Flex flexDirection="row" justifyContent="space-between">
        <Flex flexDirection="column">
          <Text color="neutral.c70" fontSize={14} paddingBottom={2}>
            {t("largeMover.low")}
          </Text>
          <Text fontSize={14} fontWeight="bold">
            {counterValueFormatter({
              currency: counterValueCurrency.ticker,
              value: low,
              locale,
              t,
            })}
          </Text>
        </Flex>
        <Flex flexDirection="column" alignItems="flex-end">
          <Text color="neutral.c70" fontSize={14} paddingBottom={2}>
            {t("largeMover.high")}
          </Text>
          <Text fontSize={14} fontWeight="bold">
            {counterValueFormatter({
              currency: counterValueCurrency.ticker,
              value: high,
              locale,
              t,
            })}
          </Text>
        </Flex>
      </Flex>
      <Flex paddingTop={6}>
        <ProgressPoint start={low} end={high} current={price} />
      </Flex>
    </Flex>
  );
};
