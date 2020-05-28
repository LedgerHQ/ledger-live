// @flow
import { BigNumber } from "bignumber.js";
import React from "react";
import type { ComponentType } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import SafeAreaView from "react-native-safe-area-view";
import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import type { Account } from "@ledgerhq/live-common/lib/types";
// TODO move to component
import DelegatingContainer from "../families/tezos/DelegatingContainer";
import Close from "../icons/Close";
import colors, { rgba } from "../colors";
import getWindowDimensions from "../logic/getWindowDimensions";
import BottomModal from "./BottomModal";
import Circle from "./Circle";
import Touchable from "./Touchable";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";
import CurrencyIcon from "./CurrencyIcon";

type Props = {
  isOpen: boolean,
  onClose: () => void,
  account: Account,
  ValidatorImage: ComponentType<{ size: number }>,
  counterValueDate?: Date,
  amount: BigNumber,
  data: FieldType[],
  actions: Action[],
};

export default function DelegationDrawer({
  isOpen,
  onClose,
  account,
  ValidatorImage,
  counterValueDate,
  // TODO use formattedAmount & formattedCounterValue instead
  amount,
  data,
  actions,
}: Props) {
  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);
  const unit = getAccountUnit(account);

  const height = Math.min(getWindowDimensions().height - 400, 280);

  return (
    <BottomModal
      id="InfoModal"
      style={styles.modal}
      isOpened={isOpen}
      onClose={onClose}
    >
      <SafeAreaView style={styles.root} forceInset={{ bottom: "always" }}>
        <Touchable
          event="DelegationDetailsModalClose"
          onPress={onClose}
          style={styles.closeButton}
        >
          <Circle size={32} bg={colors.lightFog}>
            <Close />
          </Circle>
        </Touchable>

        <DelegatingContainer
          left={
            <Circle size={64} bg={rgba(color, 0.2)}>
              <CurrencyIcon size={32} currency={currency} />
            </Circle>
          }
          right={<ValidatorImage size={64} />}
        />

        <View style={styles.subHeader}>
          <LText tertiary style={[styles.text, styles.currencyValue]}>
            <CurrencyUnitValue showCode unit={unit} value={amount} />
          </LText>

          <LText tertiary style={styles.counterValue}>
            <CounterValue
              currency={currency}
              showCode
              value={amount}
              alwaysShowSign={false}
              withPlaceholder
              date={counterValueDate}
            />
          </LText>
        </View>

        <ScrollView style={{ height }}>
          {data.map((field, i) => (
            <DataField {...field} isLast={i === data.length - 1} />
          ))}
        </ScrollView>

        <View style={[styles.row, styles.actionsRow]}>
          {actions.map(props => (
            <ActionButton {...props} />
          ))}
        </View>
      </SafeAreaView>
    </BottomModal>
  );
}

type FieldType = {
  label: string,
  Component: string | ComponentType<{}>,
};

type DataFieldProps = FieldType & {
  isLast: boolean,
};

function DataField({ label, Component, isLast }: DataFieldProps) {
  return (
    <View
      style={[styles.row, styles.fieldRow, isLast ? styles.lastRow : undefined]}
    >
      <View>
        <LText numberOfLines={1} semiBold style={styles.labelText}>
          {label}
        </LText>
      </View>

      <View style={styles.valueWrapper}>
        {typeof Component === "string" ? (
          <LText
            numberOfLines={1}
            semiBold
            style={[styles.text, styles.valueText]}
          >
            {Component}
          </LText>
        ) : (
          <Component />
        )}
      </View>
    </View>
  );
}

type Action = {
  label: string,
  Icon: string | ComponentType<IconProps>,
  event: string,
  disabled?: boolean,
  onPress: () => void,
};

export type IconProps = {
  size: number,
  style: ViewStyleProp,
  bg?: string,
};

function ActionButton({ label, Icon, event, onPress, disabled }: Action) {
  return (
    <Touchable
      disabled={disabled}
      event={event}
      style={styles.actionButtonWrapper}
      onPress={onPress}
    >
      <Icon size={48} style={styles.actionIcon} />
      <LText
        semiBold
        style={[
          styles.text,
          styles.actionText,
          disabled ? styles.disabledText : {},
        ]}
      >
        {label}
      </LText>
    </Touchable>
  );
}

export const styles = StyleSheet.create({
  modal: {
    position: "relative",
  },
  root: {
    padding: 16,
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  subHeader: {
    paddingBottom: 16,
    alignItems: "center",
    alignSelf: "center",
  },
  text: {
    color: colors.darkBlue,
  },
  currencyValue: {
    fontSize: 22,
  },
  counterValue: {
    color: colors.grey,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldRow: {
    justifyContent: "space-between",
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  labelText: {
    paddingRight: 8,
    fontSize: 14,
    color: colors.smoke,
  },
  valueWrapper: {
    width: "50%",
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 14,
  },
  valueTextTouchable: {
    color: colors.live,
  },
  actionsRow: {
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  actionWrapper: {
    width: 80,
    alignItems: "center",
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    textAlign: "center",
  },
  actionButtonWrapper: {
    width: 80,
    alignItems: "center",
  },
  disabledText: {
    color: colors.grey,
  },
});
