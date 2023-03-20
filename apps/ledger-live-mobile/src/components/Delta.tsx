import React, { memo } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { PortfolioRange, ValueChange } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import {
  ArrowEvolutionUpMedium,
  ArrowEvolutionDownMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { BaseTextProps } from "@ledgerhq/native-ui/components/Text/index";
import CurrencyUnitValue from "./CurrencyUnitValue";

type Props = {
  valueChange: ValueChange;
  percent?: boolean;
  unit?: Unit;
  range?: PortfolioRange;
  style?: StyleProp<ViewStyle>;
  /** whether to still render something for a 0% variation */
  show0Delta?: boolean;
  /** whether to show a placeholder in case the percent value is not valid */
  fallbackToPercentPlaceholder?: boolean;
  textProperties?: Partial<BaseTextProps>;
};

function Delta({
  valueChange,
  percent,
  unit,
  range,
  style,
  show0Delta,
  fallbackToPercentPlaceholder,
  textProperties,
}: Props) {
  const { t } = useTranslation();

  const percentPlaceholder = fallbackToPercentPlaceholder ? (
    <Text
      variant={"large"}
      color="neutral.c60"
      fontWeight={"semiBold"}
      {...textProperties}
    >
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
        ? ["success.c100", ArrowEvolutionUpMedium, "+"]
        : ["error.c100", ArrowEvolutionDownMedium, "-"]
      : ["neutral.c70", () => null, ""];

  if (
    percent &&
    ((valueChange.percentage === 0 && !show0Delta) ||
      valueChange.percentage === null ||
      valueChange.percentage === undefined)
  ) {
    if (fallbackToPercentPlaceholder) return percentPlaceholder;
    if (percent) return <ArrowIcon size={20} color={color} />;
    return null;
  }

  if (Number.isNaN(delta)) {
    if (percent && fallbackToPercentPlaceholder) return percentPlaceholder;
    return null;
  }

  const absDelta = Math.abs(delta);

  return (
    <View style={[styles.root, style]}>
      {percent ? <ArrowIcon size={20} color={color} /> : null}
      <View style={percent ? styles.content : null}>
        <Text
          fontWeight={"semiBold"}
          variant={"large"}
          color={color}
          {...textProperties}
        >
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
