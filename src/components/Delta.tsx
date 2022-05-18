import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Unit } from "@ledgerhq/live-common/lib/types";
import {
  PortfolioRange,
  ValueChange,
} from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { Text } from "@ledgerhq/native-ui";
import {
  ArrowUpMedium,
  ArrowDownMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import CurrencyUnitValue from "./CurrencyUnitValue";

type Props = {
  valueChange: ValueChange;
  percent?: boolean;
  unit?: Unit;
  range?: PortfolioRange;
  style?: any;
  /** whether to still render something for a 0% variation */
  show0Delta?: boolean;
  /** whether to show a placeholder in case the percent value is not valid */
  fallbackToPercentPlaceholder?: boolean;
};

function Delta({
  valueChange,
  percent,
  unit,
  range,
  style,
  show0Delta,
  fallbackToPercentPlaceholder,
}: Props) {
  const { t } = useTranslation();

  const percentPlaceholder = fallbackToPercentPlaceholder ? (
    <Text variant={"body"} color="neutral.c60" fontWeight={"medium"}>
      -
    </Text>
  ) : null;

  const delta =
    percent && valueChange.percentage
      ? valueChange.percentage * 100
      : valueChange.value;

  const [color, ArrowIcon, sign] =
    delta !== 0
      ? delta > 0
        ? ["success.c100", ArrowUpMedium, "+"]
        : ["error.c100", ArrowDownMedium, "-"]
      : ["neutral.c100", () => null, ""];

  if (
    percent &&
    ((valueChange.percentage === 0 && !show0Delta) ||
      valueChange.percentage === null ||
      valueChange.percentage === undefined)
  ) {
    if (fallbackToPercentPlaceholder) return percentPlaceholder;
    if (percent) return <ArrowIcon size={16} color={color} />;
    return null;
  }

  if (Number.isNaN(delta)) {
    if (percent && fallbackToPercentPlaceholder) return percentPlaceholder;
    return null;
  }

  const absDelta = Math.abs(delta);

  return (
    <View style={[styles.root, style]}>
      {percent ? <ArrowIcon size={16} color={color} /> : null}
      <View style={percent ? styles.content : null}>
        <Text variant={"body"} fontWeight={"medium"} color={color}>
          {unit && absDelta !== 0 ? (
            <CurrencyUnitValue
              before={`(${sign}`}
              after={")"}
              unit={unit}
              value={absDelta}
            />
          ) : percent ? (
            `${absDelta.toFixed(0)}%`
          ) : null}
          {range && ` (${t(`time.${range}`)})`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    marginLeft: 5,
  },
});

export default memo<Props>(Delta);
