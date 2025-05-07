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
    marketCap,
    volume,
    fdv,
    circulatingSupply,
    totalSupply,
    ticker,
    allTimeLow,
    allTimeHigh,
  } = props;
  const {
    athDate,
    atlDate,
    percentChangeATH,
    percentChangeATL,
    percentChangeMkt24h,
    counterValueCurrency,
    dateFormatter,
    locale,
    t,
  } = useInformations(props);
  return (
    <Flex flexDirection="column">
      <Text style={styles.title}>{t("largeMover.info")}</Text>

      <Flex style={styles.row}>
        <InfoCard
          label={t("largeMover.marketCap")}
          value={formatCounterValue(marketCap ?? 0, counterValueCurrency.ticker, locale, t)}
        />
        <InfoCard
          label={t("largeMover.volume")}
          value={formatCounterValue(volume ?? 0, counterValueCurrency.ticker, locale, t)}
        />
      </Flex>

      <Flex style={styles.row}>
        <InfoCard
          label={t("largeMover.fdv")}
          value={formatCounterValue(fdv ?? 0, counterValueCurrency.ticker, locale, t)}
        />
        <InfoCard
          label={t("largeMover.marketCap24h")}
          value={
            <CurrencyUnitValue
              unit={{ ...counterValueCurrency.units[0], code: "" }}
              value={percentChangeMkt24h.percentage}
              after="%"
            />
          }
        />
      </Flex>

      <Flex style={styles.row}>
        <InfoCard
          label={t("largeMover.circulatingSupply")}
          value={formatCounterValue(
            circulatingSupply ?? 0,
            counterValueCurrency.ticker,
            locale,
            t,
            {
              ticker,
            },
          )}
        />
        <InfoCard
          label={t("largeMover.totalSupply")}
          value={`${formatCounterValue(totalSupply ?? 0, counterValueCurrency.ticker, locale, t, { ticker })} ${ticker}`}
        />
      </Flex>

      <Flex paddingBottom={6}>
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
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  container: {
    flexDirection: "column",
    padding: 16,
    borderRadius: 16,
    width: "48%",
  },
  bigContainer: {
    flexDirection: "column",
    padding: 12,
    borderRadius: 16,
  },
  rowInside: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 2,
  },
  name: {
    fontSize: 15,
    paddingBottom: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  date: {
    fontSize: 12,
  },
});
