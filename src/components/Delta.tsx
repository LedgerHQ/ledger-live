import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Unit } from "@ledgerhq/live-common/lib/types";
import { ValueChange } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { Text } from "@ledgerhq/native-ui";
import {
  ArrowUpMedium,
  ArrowDownMedium,
} from "@ledgerhq/native-ui/assets/icons";
import CurrencyUnitValue from "./CurrencyUnitValue";

type Props = {
  valueChange: ValueChange;
  percent?: boolean;
  unit?: Unit;
  style?: any;
};

function Delta({ valueChange, percent, unit, style }: Props) {
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
        ? ["success.c100", ArrowUpMedium, "+"]
        : ["error.c100", ArrowDownMedium, "-"]
      : ["neutral.c100", () => null, ""];

  return (
    <View style={[styles.root, style]}>
      {percent && ArrowIcon ? <ArrowIcon size={16} color={color} /> : null}
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
