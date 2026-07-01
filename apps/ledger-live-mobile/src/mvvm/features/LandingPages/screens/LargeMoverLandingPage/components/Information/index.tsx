import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { StyleSheet } from "react-native";
import { counterValueFormatter } from "LLM/features/Market/utils";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { InformationsProps } from "../../types";
import { AthAtlBlock } from "./AthAtlBlock";
import { InfoCard } from "./InfoCard";
import { useInformations } from "../../hooks/useInformations";

export const Informations: React.FC<InformationsProps> = props => {
  const {
    athDate,
    atlDate,
    percentChangeATH,
    percentChangeATL,
    counterValueCurrency,
    dateFormatter,
    locale,
    t,
    marketCapVolume24h,
    totalVolume,
    fullyDilutedValuation,
    circulatingSupply,
    totalSupply,
    ticker,
    marketCap,
    allTimeHigh,
    allTimeLow,
  } = useInformations(props);

  return (
    <Flex flexDirection="column">
      <Text style={styles.title}>{t("largeMover.info")}</Text>

      <Flex style={styles.row}>
        <InfoCard
          left
          label={t("largeMover.marketCap")}
          value={counterValueFormatter({
            value: marketCap ?? 0,
            shorten: true,
            currency: counterValueCurrency.ticker,
            locale,
            t,
          }).toUpperCase()}
        />
        <InfoCard
          label={t("largeMover.volume")}
          value={counterValueFormatter({
            value: totalVolume ?? 0,
            shorten: true,
            currency: counterValueCurrency.ticker,
            locale,
            t,
          }).toUpperCase()}
        />
      </Flex>

      <Flex style={styles.row}>
        <InfoCard
          left
          label={t("largeMover.fdv")}
          value={counterValueFormatter({
            value: fullyDilutedValuation ?? 0,
            shorten: true,
            currency: counterValueCurrency.ticker,
            locale,
            t,
          }).toUpperCase()}
        />
        <InfoCard
          label={t("largeMover.marketCap24h")}
          value={
            <CurrencyUnitValue
              unit={{ ...counterValueCurrency.units[0], code: "" }}
              value={marketCapVolume24h}
              after="%"
            />
          }
        />
      </Flex>
      <Flex style={styles.row}>
        <InfoCard
          left
          label={t("largeMover.circulatingSupply")}
          value={counterValueFormatter({
            value: circulatingSupply,
            shorten: true,
            locale,
            t,
            ticker,
          }).toUpperCase()}
        />
        <InfoCard
          label={t("largeMover.totalSupply")}
          value={counterValueFormatter({
            value: totalSupply,
            shorten: true,
            locale,
            t,
            ticker,
          }).toUpperCase()}
        />
      </Flex>

      <Flex paddingBottom={4}>
        <AthAtlBlock
          label="largeMover.ath"
          value={allTimeHigh}
          date={athDate}
          change={percentChangeATH}
          counterValueCurrency={counterValueCurrency}
          locale={locale}
          t={t}
          dateFormatter={dateFormatter}
        />
      </Flex>

      <Flex>
        <AthAtlBlock
          label="largeMover.atl"
          value={allTimeLow}
          date={atlDate}
          change={percentChangeATL}
          counterValueCurrency={counterValueCurrency}
          locale={locale}
          t={t}
          dateFormatter={dateFormatter}
        />
      </Flex>
    </Flex>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: "bold",
    fontSize: 14,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  date: {
    fontSize: 12,
  },
});
