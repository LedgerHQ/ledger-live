import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { StyleSheet } from "react-native";
import Delta from "~/components/Delta";
import { counterValueFormatter } from "LLM/features/Market/utils";
import { TFunction } from "react-i18next";
import { ValueChange } from "@ledgerhq/types-live";
import { getTimeAgoCode } from "../../utils";
import type { Currency } from "@ledgerhq/types-cryptoassets";

type AthAtlBlockProps = {
  label: string;
  value: number;
  date: Date | null;
  change: ValueChange;
  counterValueCurrency: Currency;
  locale: string;
  t: TFunction;
  dateFormatter: Intl.DateTimeFormat;
};

export const AthAtlBlock: React.FC<AthAtlBlockProps> = ({
  label,
  value,
  date,
  change,
  counterValueCurrency,
  locale,
  t,
  dateFormatter,
}) => {
  return (
    <Flex style={styles.bigContainer} bg="neutral.c30">
      <Flex style={styles.rowInside}>
        <Text style={styles.name} color="neutral.c70">
          {t(label)}
        </Text>
        <Text style={styles.value}>
          {counterValueFormatter({ value, currency: counterValueCurrency.ticker, locale, t })}
        </Text>
      </Flex>
      <Flex style={styles.rowInside}>
        <Text style={styles.date}>
          {date ? dateFormatter.format(date) : "-"} {date ? getTimeAgoCode(date) : "-"}
        </Text>
        <Delta
          unit={{ ...counterValueCurrency.units[0], code: "" }}
          valueChange={change}
          isPercentSignDisplayed
          percent
          textProperties={{ fontSize: 12 }}
          isArrowDisplayed={false}
        />
      </Flex>
    </Flex>
  );
};

const styles = StyleSheet.create({
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
