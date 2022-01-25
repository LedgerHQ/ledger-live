// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { BigNumber } from "bignumber.js";
import { shortAddressPreview } from "@ledgerhq/live-common/lib/account";
import type { Unit } from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";

const styles = StyleSheet.create({
  dataRow: {
    padding: 12,
    borderRadius: 4,
    marginVertical: 1,

    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dataColumn: {
    padding: 12,
    borderRadius: 4,
    marginVertical: 1,
    alignItems: "flex-start",
    flexDirection: "column",
  },
  dataRowLabel: {
    textAlign: "left",
    fontSize: 14,
    paddingRight: 8,
  },
  dataRowValue: {
    fontSize: 14,
    flexGrow: 1,
    textAlign: "right",
  },
  text: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  lineLabel: { justifyContent: "flex-start" },
  validatorLabel: { fontSize: 12 },
});

export function DataRow({
  label,
  children,
  numberOfLines,
}: {
  label?: React$Node,
  children: React$Node,
  numberOfLines?: number,
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.dataRow, { backgroundColor: colors.background }]}>
      {label ? (
        <LText
          numberOfLines={numberOfLines ?? 1}
          style={styles.dataRowLabel}
          color="grey"
        >
          {label}
        </LText>
      ) : null}
      {children}
    </View>
  );
}

export function TextValueField({
  label,
  numberOfLines,
  value,
}: {
  label: React$Node,
  numberOfLines?: number,
  value: string,
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.dataRow, { backgroundColor: colors.background }]}>
      <LText
        numberOfLines={numberOfLines}
        style={styles.dataRowLabel}
        color="grey"
      >
        {label}
      </LText>
      <LText numberOfLines={numberOfLines} style={styles.dataRowValue}>
        {value}
      </LText>
    </View>
  );
}

export function HeaderRow({ label, value }: { label: string, value: string }) {
  return (
    <DataRow>
      <LText style={[styles.text, { textAlign: "left" }]} color="grey">
        {label}
      </LText>
      <LText style={[styles.text]} color="grey">
        {value}
      </LText>
    </DataRow>
  );
}

export function ValidatorField({
  address,
  name,
  amount,
}: {
  address: string,
  name: string,
  amount: string,
}) {
  return (
    <DataRow key={address}>
      <View style={styles.lineLabel}>
        <LText semiBold>{shortAddressPreview(address)}</LText>
        <LText style={styles.validatorLabel} color="grey">
          {name}
        </LText>
      </View>
      <LText semiBold style={styles.text}>
        {amount}
      </LText>
    </DataRow>
  );
}

export function DataColumn({
  label,
  children,
  numberOfLines,
}: {
  label?: React$Node,
  children: React$Node,
  numberOfLines?: number,
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.dataColumn, { backgroundColor: colors.background }]}>
      {label ? (
        <LText
          numberOfLines={numberOfLines ?? 1}
          style={styles.dataRowLabel}
          color="grey"
        >
          {label}
        </LText>
      ) : null}
      {children}
    </View>
  );
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
        <LText semiBold style={styles.dataRowValue}>
          <CurrencyUnitValue unit={unit} value={value} disableRounding />
        </LText>
      </DataRow>
    );
  }
}
