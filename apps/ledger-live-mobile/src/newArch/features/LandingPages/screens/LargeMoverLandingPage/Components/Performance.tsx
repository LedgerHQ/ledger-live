import { Flex, Text, ProgressPoint } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useSelector } from "react-redux";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";

type PerformanceProps = {
  low: number;
  high: number;
  price: number;
};

export const Performance: React.FC<PerformanceProps> = ({ low, high, price }) => {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  return (
    <Flex>
      <Text fontWeight="bold" fontSize={14} paddingBottom={6}>
        {t("largeMover.performance")}
      </Text>
      <Flex flexDirection="row" justifyContent="space-between">
        <Flex flexDirection="column">
          <Text color="neutral.c70" fontSize={14} paddingBottom={2}>
            {t("largeMover.low")}
          </Text>
          <Text fontSize={14} fontWeight="bold">
            <CurrencyUnitValue unit={counterValueCurrency.units[0]} value={low} />
          </Text>
        </Flex>
        <Flex flexDirection="column" alignItems="flex-end">
          <Text color="neutral.c70" fontSize={14} paddingBottom={2}>
            {t("largeMover.high")}
          </Text>
          <Text fontSize={14} fontWeight="bold">
            <CurrencyUnitValue unit={counterValueCurrency.units[0]} value={high} />
          </Text>
        </Flex>
      </Flex>
      <Flex paddingTop={6}>
        <ProgressPoint start={low} end={high} current={price} />
      </Flex>
    </Flex>
  );
};
