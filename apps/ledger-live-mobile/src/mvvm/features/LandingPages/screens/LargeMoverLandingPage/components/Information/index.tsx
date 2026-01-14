import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { StyleSheet } from "react-native";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { InformationsProps } from "../../types";
import { formatCounterValue } from "../../utils";
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
          value={formatCounterValue(marketCap ?? 0, counterValueCurrency.ticker, locale, t)}
        />
        <InfoCard
          label={t("largeMover.volume")}
          value={formatCounterValue(totalVolume ?? 0, counterValueCurrency.ticker, locale, t)}
        />
      </Flex>

      <Flex style={styles.row}>
        <InfoCard
          left
          label={t("largeMover.fdv")}
          value={formatCounterValue(
            fullyDilutedValuation ?? 0,
            counterValueCurrency.ticker,
            locale,
            t,
          )}
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
          value={formatCounterValue(circulatingSupply, "", locale, t, {
            ticker,
          })}
        />
        <InfoCard
          label={t("largeMover.totalSupply")}
          value={`${formatCounterValue(totalSupply, "", locale, t, { ticker })} ${ticker}`}
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
