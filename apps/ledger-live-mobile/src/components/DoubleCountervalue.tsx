import React, { useState, useCallback, memo } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { useCalculate } from "@ledgerhq/live-common/countervalues/react";
import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { counterValueCurrencySelector } from "../reducers/settings";
import CurrencyUnitValue, { CurrencyUnitValueProps } from "./CurrencyUnitValue";
import LText from "./LText";
import InfoIcon from "../icons/Info";
import QueuedDrawer from "./QueuedDrawer";
import Circle from "./Circle";
import FormatDate from "./DateFormat/FormatDate";

type Props = {
  // wich market to query
  currency: Currency;
  date: Date;
  compareDate?: Date;
  value: BigNumber;
  // display grey placeholder if no value
  withPlaceholder?: boolean;
  placeholderProps?: unknown;
  // as we can't render View inside Text, provide ability to pass
  // wrapper component from outside
  Wrapper?: React.ComponentType;
  subMagnitude?: number;
  tooltipDateLabel?: React.ReactNode;
  tooltipCompareDateLabel?: React.ReactNode;
} & Partial<CurrencyUnitValueProps>;

function DoubleCounterValue({
  value,
  date,
  compareDate = new Date(),
  withPlaceholder,
  placeholderProps,
  Wrapper,
  currency,
  tooltipDateLabel,
  tooltipCompareDateLabel,
  ...props
}: Props) {
  const { colors } = useTheme();
  const [isOpened, setIsOpened] = useState(false);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const val = value.toNumber();
  const countervalue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value: val,
    disableRounding: true,
    date,
  });
  const compareCountervalue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value: val,
    disableRounding: true,
    date: compareDate,
  });
  const onClose = useCallback(() => setIsOpened(false), []);
  const onOpen = useCallback(() => setIsOpened(true), []);
  const [placeholderModalOpened, setPlaceholderModalOpened] = useState(false);
  const openModal = useCallback(() => setPlaceholderModalOpened(true), []);
  const closeModal = useCallback(() => setPlaceholderModalOpened(false), []);

  if (typeof countervalue !== "number") {
    return withPlaceholder ? (
      <TouchableOpacity style={styles.placeholderButton} onPress={openModal}>
        <LText style={styles.placeholderLabel}>-</LText>
        <QueuedDrawer
          isRequestingToBeOpened={placeholderModalOpened}
          onClose={closeModal}
          style={[styles.modal]}
        >
          <Circle bg={colors.lightLive} size={70}>
            <InfoIcon size={30} color={colors.live} />
          </Circle>

          <LText style={styles.modalTitle} semiBold>
            <Trans i18nKey="errors.countervaluesUnavailable.title" />
          </LText>
        </QueuedDrawer>
      </TouchableOpacity>
    ) : null;
  }

  const inner = (
    <>
      <TouchableOpacity style={styles.root} onPress={onOpen}>
        <LText style={styles.label} color="smoke">
          <CurrencyUnitValue
            {...props}
            unit={counterValueCurrency.units[0]}
            value={BigNumber(countervalue)}
          />
        </LText>

        <InfoIcon size={16} color={colors.grey} />
      </TouchableOpacity>
      <QueuedDrawer
        isRequestingToBeOpened={isOpened}
        onClose={onClose}
        style={styles.modal}
      >
        <View style={styles.row}>
          <View style={styles.column}>
            <LText bold style={styles.title}>
              <Trans i18nKey="common.transactionDate" />
            </LText>
            <LText style={styles.subtitle} color="grey">
              <FormatDate date={date} />
            </LText>
          </View>
          <LText semiBold style={styles.amount} color="grey">
            <CurrencyUnitValue
              {...props}
              unit={counterValueCurrency.units[0]}
              value={BigNumber(countervalue)}
            />
          </LText>
        </View>
        <View
          style={[
            styles.separator,
            {
              backgroundColor: colors.lightFog,
            },
          ]}
        />
        <View style={styles.row}>
          <View style={styles.column}>
            <LText bold style={styles.title}>
              <Trans i18nKey="common.today" />
            </LText>
            <LText style={styles.subtitle} color="grey">
              <FormatDate date={compareDate} />
            </LText>
          </View>
          {typeof compareCountervalue === "number" ? (
            <LText semiBold style={styles.amount} color="grey">
              <CurrencyUnitValue
                {...props}
                unit={counterValueCurrency.units[0]}
                value={BigNumber(compareCountervalue)}
              />
            </LText>
          ) : (
            <LText style={styles.placeholder}>-</LText>
          )}
        </View>
      </QueuedDrawer>
    </>
  );

  if (Wrapper) {
    return <Wrapper>{inner}</Wrapper>;
  }

  return inner;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginRight: 8,
  },
  modal: {
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: "center",
  },
  modalTitle: {
    marginVertical: 24,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  placeholderButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderLabel: {
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    width: "100%",
  },
  column: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 13,
  },
  subtitle: {
    fontSize: 12,
    fontStyle: "italic",
  },
  placeholder: {
    fontSize: 16,
  },
  amount: {
    fontSize: 12,
  },
  separator: {
    width: "100%",
    height: 1,
    marginVertical: 16,
  },
});
export default memo<Props>(DoubleCounterValue);
