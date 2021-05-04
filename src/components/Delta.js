// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import type { Unit } from "@ledgerhq/live-common/lib/types";
import type { ValueChange } from "@ledgerhq/live-common/lib/portfolio/v2/types";

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
  if (percent && (!valueChange.percentage || valueChange.percentage === 0)) {
    return null;
  }

  const delta =
    percent && valueChange.percentage
      ? valueChange.percentage * 100
      : valueChange.value;

  if (Number.isNaN(delta)) {
    return null;
  }

  const absDelta = Math.abs(delta);

  const [color, ArrowIcon, sign] =
    delta !== 0
      ? delta > 0
        ? [colors.success, IconArrowUp, "+"]
        : [colors.alert, IconArrowDown, "-"]
      : [colors.darkBlue, () => null, ""];

  return (
    <View style={[styles.root, style]}>
      {percent && ArrowIcon ? <ArrowIcon size={10} color={color} /> : null}
      <View style={percent ? styles.content : null}>
        <LText semiBold style={[styles.text, { color }]}>
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
