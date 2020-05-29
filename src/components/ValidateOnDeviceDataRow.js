// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/live-common/lib/types";
import colors from "../colors";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";

const styles = StyleSheet.create({
  dataRow: {
    padding: 12,
    borderRadius: 4,
    marginVertical: 1,
    backgroundColor: colors.lightGrey,
    alignItems: "center",
    flexDirection: "row",
  },
  dataRowLabel: {
    color: colors.grey,
    textAlign: "left",
    fontSize: 14,
    paddingRight: 16,
    flex: 0.5,
  },
  dataRowValue: {
    color: colors.darkBlue,
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
});

export class DataRow extends PureComponent<{
  label?: React$Node,
  children: React$Node,
  numberOfLines?: number,
}> {
  render() {
    const { label, children, numberOfLines } = this.props;
    return (
      <View style={styles.dataRow}>
        {label ? (
          <LText numberOfLines={numberOfLines ?? 1} style={styles.dataRowLabel}>
            {label}
          </LText>
        ) : null}
        {children}
      </View>
    );
  }
}

export class DataRowUnitValue extends PureComponent<{
  label: React$Node,
  value: BigNumber,
  unit: Unit,
}> {
  render() {
    const { label, value, unit } = this.props;
    return (
      <DataRow label={label}>
        <LText tertiary style={styles.dataRowValue}>
          <CurrencyUnitValue unit={unit} value={value} disableRounding />
        </LText>
      </DataRow>
    );
  }
}
