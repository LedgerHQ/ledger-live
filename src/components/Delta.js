// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import type { Unit, ValueChange } from "@ledgerhq/live-common/lib/types";

import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import IconArrowUp from "../icons/ArrowUp";
import IconArrowDown from "../icons/ArrowDown";

import { normalize } from "../helpers/normalizeSize";

type Props = {
  valueChange: ValueChange,
  percent?: boolean,
  unit?: Unit,
  style?: *,
};

function Delta({ valueChange, percent, unit, style }: Props) {
  const { colors } = useTheme();
  if (
    percent &&
    (!valueChange.percentage || valueChange.percentage.isEqualTo(0))
  ) {
    return null;
  }

  const delta =
    percent && valueChange.percentage
      ? valueChange.percentage.multipliedBy(100)
      : valueChange.value;

  if (delta.isNaN()) {
    return null;
  }

  const absDelta = delta.absoluteValue();

  const [color, ArrowIcon, sign] = !delta.isZero()
    ? delta.isGreaterThan(0)
      ? [colors.success, IconArrowUp, "+"]
      : [colors.alert, IconArrowDown, "-"]
    : [colors.darkBlue, null, ""];

  return (
    <View style={[styles.root, style]}>
      {percent ? ArrowIcon : null}
      <View style={percent ? styles.content : null}>
        <LText semiBold style={[styles.text, { color }]}>
          {unit && !absDelta.isZero() ? (
            <CurrencyUnitValue
              before={`(${sign}`}
              after={")"}
              unit={unit}
              value={absDelta}
            />
          ) : percent ? (
            `${absDelta.toFixed(0)}%`
          ) : null}
        </LText>
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
  text: {
    fontSize: normalize(16),
  },
});

export default memo<Props>(Delta);
