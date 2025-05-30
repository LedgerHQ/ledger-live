import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import React from "react";
import { StyleSheet, View } from "react-native";
import CurrencyUnitValue from "./CurrencyUnitValue";
import LText from "./LText";

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
    alignItems: "flex-end",
  },
  valueText: {
    textAlign: "right",
  },
  text: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  lineLabel: {
    justifyContent: "flex-start",
  },
  validatorLabel: {
    fontSize: 12,
  },
});
export function DataRow({
  label,
  children,
  numberOfLines,
}: {
  label?: React.ReactNode;
  children: React.ReactNode;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.dataRow,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {label ? (
        <LText numberOfLines={numberOfLines ?? 1} style={styles.dataRowLabel} color="grey">
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
  testID,
}: {
  label: React.ReactNode;
  numberOfLines?: number;
  value: React.ReactNode;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.dataRow,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <LText numberOfLines={numberOfLines} style={styles.dataRowLabel} color="grey">
        {label}
      </LText>
      <View style={styles.dataRowValue}>
        <LText numberOfLines={numberOfLines} testID={testID} style={styles.valueText}>
          {value}
        </LText>
      </View>
    </View>
  );
}
export function HeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <DataRow>
      <LText
        style={[
          styles.text,
          {
            textAlign: "left",
          },
        ]}
        color="grey"
      >
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
  address: string;
  name: string;
  amount: string;
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
  label?: React.ReactNode;
  children: React.ReactNode;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.dataColumn,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {label ? (
        <LText numberOfLines={numberOfLines ?? 1} style={styles.dataRowLabel} color="grey">
          {label}
        </LText>
      ) : null}
      {children}
    </View>
  );
}

type Props = {
  label: React.ReactNode;
  value: BigNumber;
  unit: Unit;
  testID?: string;
};

export const DataRowUnitValue = ({ label, value, unit, testID }: Props) => {
  return (
    <DataRow label={label}>
      <LText semiBold style={styles.dataRowValue} testID={testID}>
        <CurrencyUnitValue unit={unit} value={value} disableRounding />
      </LText>
    </DataRow>
  );
};
