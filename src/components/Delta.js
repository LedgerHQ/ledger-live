// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import type { Unit, ValueChange } from "@ledgerhq/live-common/lib/types";

import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import IconArrowUp from "../icons/ArrowUp";
import IconArrowDown from "../icons/ArrowDown";

import colors from "../colors";

type Props = {
  valueChange: ValueChange,
  percent?: boolean,
  unit?: Unit,
  style?: *,
};

const arrowUp = <IconArrowUp size={12} color={colors.success} />;
const arrowDown = <IconArrowDown size={12} color={colors.alert} />;

export default class Delta extends PureComponent<Props> {
  render() {
    const { valueChange, percent, unit, style } = this.props;

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

    const [color, arrow, sign] = !delta.isZero()
      ? delta.isGreaterThan(0)
        ? [colors.success, arrowUp, "+"]
        : [colors.alert, arrowDown, "-"]
      : [colors.darkBlue, null, ""];

    return (
      <View style={[styles.root, style]}>
        {percent ? arrow : null}
        <View style={percent ? styles.content : null}>
          <LText semiBold style={[styles.text, { color }]}>
            {unit ? (
              <CurrencyUnitValue
                before={`(${sign} `}
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
    fontSize: 16,
  },
});
