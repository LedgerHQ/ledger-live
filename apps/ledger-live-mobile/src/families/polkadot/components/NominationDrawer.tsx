import React from "react";
import type { ComponentType } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import type { AccountLike } from "@ledgerhq/types-live";
// TODO move to component
import { useTheme } from "@react-navigation/native";
import DelegatingContainer from "../../tezos/DelegatingContainer";
import { rgba } from "../../../colors";
import getWindowDimensions from "~/logic/getWindowDimensions";
import QueuedDrawer from "~/components/QueuedDrawer";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import CurrencyIcon from "~/components/CurrencyIcon";
import IconHelp from "~/icons/Info";
import { normalize } from "~/helpers/normalizeSize";

const { height } = getWindowDimensions();
type Props = {
  isOpen: boolean;
  onClose: () => void;
  account: AccountLike;
  icon?: React.ReactNode;
  ValidatorImage: ComponentType<{
    size: number;
  }>;
  data: FieldType[];
  isNominated?: boolean;
};
export default function NominationDrawer({
  isOpen,
  onClose,
  account,
  ValidatorImage,
  data,
  icon,
  isNominated,
}: Props) {
  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);
  const iconWidth = normalize(64);
  return (
    <QueuedDrawer style={styles.modal} isRequestingToBeOpened={isOpen} onClose={onClose}>
      <View style={styles.root}>
        {isNominated ? (
          <DelegatingContainer
            left={
              icon || (
                <Circle size={iconWidth} bg={rgba(color, 0.2)}>
                  <CurrencyIcon size={iconWidth / 2} currency={currency} bg={"rgba(0,0,0,0)"} />
                </Circle>
              )
            }
            right={<ValidatorImage size={iconWidth} />}
          />
        ) : (
          <View style={styles.iconContainer}>
            <ValidatorImage size={iconWidth} />
          </View>
        )}

        <ScrollView style={styles.scrollSection} showsVerticalScrollIndicator={true}>
          {data.map((field, i) => (
            <DataField {...field} key={"data-" + i} isLast={i === data.length - 1} />
          ))}
        </ScrollView>
      </View>
    </QueuedDrawer>
  );
}
type FieldType = {
  label: React.ReactNode;
  info?: React.ReactNode;
  infoType?: "info" | "warning";
  Component: React.ReactNode;
};
type DataFieldProps = FieldType & {
  isLast: boolean;
};

function DataField({ label, info, infoType, Component, isLast }: DataFieldProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colors.lightFog,
        },
        isLast ? styles.lastRow : undefined,
      ]}
    >
      <View style={styles.rowWrapper}>
        <LText numberOfLines={1} semiBold style={styles.labelText} color="smoke">
          {label}
        </LText>
        <View style={styles.valueWrapper}>{Component}</View>
      </View>
      {info ? (
        <View style={[styles.infoBox]}>
          <IconHelp color={infoType === "warning" ? colors.orange : colors.grey} size={16} />
          <LText style={[styles.infoContent]} color={infoType === "warning" ? "orange" : "grey"}>
            {info}
          </LText>
        </View>
      ) : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  modal: {
    position: "relative",
  },
  root: {
    paddingTop: 8,
  },
  iconContainer: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    paddingTop: 16,
  },
  scrollSection: {
    maxHeight: height - normalize(425),
    paddingHorizontal: 16,
  },
  rowWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  row: {
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
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  infoContent: {
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
});
