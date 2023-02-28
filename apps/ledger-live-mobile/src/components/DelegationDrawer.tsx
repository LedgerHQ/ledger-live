import { BigNumber } from "bignumber.js";
import React from "react";
import type { ComponentType } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import type { AccountLike } from "@ledgerhq/types-live";
// TODO move to component
import { useTheme } from "@react-navigation/native";
import DelegatingContainer from "../families/tezos/DelegatingContainer";
import { rgba } from "../colors";
import getWindowDimensions from "../logic/getWindowDimensions";
import QueuedDrawer from "./QueuedDrawer";
import Circle from "./Circle";
import Touchable from "./Touchable";
import LText from "./LText";
import CurrencyUnitValue from "./CurrencyUnitValue";
import CounterValue from "./CounterValue";
import CurrencyIcon from "./CurrencyIcon";
import { normalize } from "../helpers/normalizeSize";

const { height } = getWindowDimensions();
type Props = {
  isOpen: boolean;
  onClose: () => void;
  account: AccountLike;
  icon?: React.ReactNode;
  ValidatorImage: ComponentType<{
    size: number;
  }>;
  counterValueDate?: Date;
  amount: BigNumber;
  data: FieldType[];
  actions: Action[];
  undelegation?: boolean;
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
  undelegation,
  icon,
}: Props) {
  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);
  const unit = getAccountUnit(account);
  const iconWidth = normalize(64);
  return (
    <QueuedDrawer
      style={styles.modal}
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
    >
      <View style={styles.root}>
        <DelegatingContainer
          left={
            icon || (
              <Circle size={iconWidth} bg={rgba(color, 0.2)}>
                <CurrencyIcon
                  size={iconWidth / 2}
                  currency={currency}
                  bg={"rgba(0,0,0,0)"}
                />
              </Circle>
            )
          }
          undelegation={undelegation}
          right={<ValidatorImage size={iconWidth} />}
        />

        <View style={styles.subHeader}>
          <LText semiBold style={[styles.currencyValue]}>
            <CurrencyUnitValue showCode unit={unit} value={amount} />
          </LText>

          <LText semiBold style={styles.counterValue} color="grey">
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

        <ScrollView
          style={styles.scrollSection}
          showsVerticalScrollIndicator={true}
        >
          {data.map((field, i) => (
            <DataField
              {...field}
              key={"data-" + i}
              isLast={i === data.length - 1}
            />
          ))}
        </ScrollView>

        <View style={[styles.row, styles.actionsRow]}>
          {actions.map(props => (
            <ActionButton {...props} />
          ))}
        </View>
      </View>
    </QueuedDrawer>
  );
}
export type FieldType = {
  label: React.ReactNode;
  Component: React.ReactNode;
};
type DataFieldProps = FieldType & {
  isLast: boolean;
};

function DataField({ label, Component, isLast }: DataFieldProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        styles.fieldRow,
        {
          borderBottomColor: colors.lightFog,
        },
        isLast ? styles.lastRow : undefined,
      ]}
    >
      <View>
        <LText
          numberOfLines={1}
          semiBold
          style={styles.labelText}
          color="smoke"
        >
          {label}
        </LText>
      </View>

      <View style={styles.valueWrapper}>{Component}</View>
    </View>
  );
}

export type Action = {
  label?: React.ReactNode;
  Icon: string | ComponentType<IconProps>;
  event?: string;
  eventProperties?: Record<string, unknown>;
  disabled?: boolean;
  onPress?: () => void;
};

export type IconProps = {
  size: number;
  style: StyleProp<ViewStyle>;
  bg?: string;
};

function ActionButton({
  label,
  Icon,
  event,
  eventProperties,
  onPress,
  disabled,
}: Action) {
  return (
    <Touchable
      disabled={disabled}
      event={event}
      eventProperties={eventProperties}
      style={styles.actionButtonWrapper}
      onPress={onPress}
    >
      <Icon size={48} style={styles.actionIcon} />
      <LText
        semiBold
        style={[styles.actionText]}
        color={disabled ? "grey" : "darkBlue"}
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
    paddingTop: 8,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginRight: 16,
  },
  scrollSection: {
    maxHeight: height - normalize(425),
    paddingHorizontal: 16,
  },
  subHeader: {
    paddingBottom: 16,
    alignItems: "center",
    alignSelf: "center",
  },
  currencyValue: {
    fontSize: 22,
  },
  counterValue: {
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldRow: {
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  labelText: {
    paddingRight: 8,
    fontSize: 14,
  },
  valueWrapper: {
    width: "50%",
    alignItems: "flex-end",
  },
  actionsRow: {
    paddingTop: 16,
    paddingHorizontal: 16,
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
});
