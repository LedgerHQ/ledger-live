import React, { memo } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { PortfolioRange, ValueChange } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { ArrowEvolutionUpMedium, ArrowEvolutionDownMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "~/context/Locale";
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
  isPercentSignDisplayed?: boolean;
  isArrowDisplayed?: boolean;
  testID?: string;
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
  isPercentSignDisplayed = false,
  isArrowDisplayed = true,
  testID,
}: Props) {
  const { t } = useTranslation();

  const percentPlaceholder = fallbackToPercentPlaceholder ? (
    // eslint-disable-next-line i18next/no-literal-string
    <Text variant="large" color="neutral.c60" fontWeight="semiBold" {...textProperties}>
      &minus;
    </Text>
  ) : null;

  const delta =
    (percent || isPercentSignDisplayed) && valueChange.percentage
      ? valueChange.percentage * 100
      : valueChange.value;

  const roundedDelta = parseFloat(delta.toFixed(2));

  if (roundedDelta === 0) {
    return percentPlaceholder;
  }

  const [color, ArrowIcon, sign] =
    roundedDelta > 0
      ? [isPercentSignDisplayed ? "success.c70" : "success.c50", ArrowEvolutionUpMedium, "+"]
      : roundedDelta < 0
        ? ["error.c50", ArrowEvolutionDownMedium, "-"]
        : ["neutral.c70", () => null, "-"];

  if (
    percent &&
    ((valueChange.percentage === 0 && !show0Delta) ||
      valueChange.percentage === null ||
      valueChange.percentage === undefined)
  ) {
    if (fallbackToPercentPlaceholder) return percentPlaceholder;
    if (percent && isArrowDisplayed) return <ArrowIcon size={20} color={color} />;
    return null;
  }

  if (Number.isNaN(delta)) {
    if (percent && fallbackToPercentPlaceholder) return percentPlaceholder;
    return null;
  }

  const absDelta = Math.abs(delta);

  return (
    <View style={[styles.root, style]}>
      {percent && isArrowDisplayed ? <ArrowIcon size={20} color={color} /> : null}
      <View style={percent ? styles.content : null}>
        <Text
          fontWeight={isPercentSignDisplayed ? undefined : "semiBold"}
          variant={"large"}
          color={color}
          testID={testID}
          {...textProperties}
        >
          {unit && absDelta !== 0 ? (
            <CurrencyUnitValue
              before={isPercentSignDisplayed ? sign : `(${sign}`}
              after={isPercentSignDisplayed ? "" : ")"}
              unit={unit}
              value={absDelta}
            />
          ) : percent ? (
            `${absDelta.toFixed(2)}%`
          ) : null}
          {range && ` (${t(`time.${range}`)})`}
          {isPercentSignDisplayed ? "%" : ""}
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

/**
 * @note Use the Delta component from the mvvm directory instead.
 * The new one relies on Lumen UI lib.
 */
export default memo<Props>(Delta);
