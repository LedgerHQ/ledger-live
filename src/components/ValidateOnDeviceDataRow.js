// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { BigNumber } from "bignumber.js";
import { shortAddressPreview } from "@ledgerhq/live-common/lib/account";
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
  dataColumn: {
    padding: 12,
    borderRadius: 4,
    marginVertical: 1,
    backgroundColor: colors.lightGrey,
    alignItems: "flex-start",
    flexDirection: "column",
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
  text: {
    color: colors.darkBlue,
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  greyText: {
    color: colors.grey,
  },
  lineLabel: { justifyContent: "flex-start" },
  validatorLabel: { fontSize: 12, color: colors.grey },
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

export function TextValueField({
  label,
  numberOfLines,
  value,
}: {
  label: React$Node,
  numberOfLines?: number,
  value: string,
}) {
  return (
    <View style={styles.dataRow}>
      <LText numberOfLines={numberOfLines} style={styles.dataRowLabel}>
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
      <LText style={[styles.text, styles.greyText, { textAlign: "left" }]}>
        {label}
      </LText>
      <LText style={[styles.text, styles.greyText]}>{value}</LText>
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
        <LText style={styles.validatorLabel}>{name}</LText>
      </View>
      <LText semiBold style={styles.text}>
        {amount}
      </LText>
    </DataRow>
  );
}

export class DataColumn extends PureComponent<{
  label?: React$Node,
  children: React$Node,
  numberOfLines?: number,
}> {
  render() {
    const { label, children, numberOfLines } = this.props;
    return (
      <View style={styles.dataColumn}>
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
