// @flow
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import type { Currency } from "@ledgerhq/live-common/types/index";
import {
  useCalculate,
  useCountervaluesPolling,
} from "@ledgerhq/live-common/countervalues/react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { counterValueCurrencySelector } from "../reducers/settings";
import {
  useTrackingPairs,
  addExtraSessionTrackingPair,
} from "../actions/general";
import CurrencyUnitValue from "./CurrencyUnitValue";
import LText from "./LText";
import Circle from "./Circle";
import IconHelp from "../icons/Info";
import BottomModal from "./BottomModal";

type Props = {
  // wich market to query
  currency: Currency,
  // when? if not given: take latest
  date?: Date,
  value: BigNumber | number,
  // display grey placeholder if no value
  withPlaceholder?: boolean,
  placeholderProps?: mixed,
  // as we can't render View inside Text, provide ability to pass
  // wrapper component from outside
  Wrapper?: React$ComponentType<*>,
  subMagnitude?: number,
  joinFragmentsSeparator?: string,
  alwaysShowValue?: boolean,
};

export const NoCountervaluePlaceholder = () => {
  const { colors } = useTheme();
  const [modalOpened, setModalOpened] = useState(false);
  const openModal = useCallback(() => setModalOpened(true), []);
  const closeModal = useCallback(() => setModalOpened(false), []);

  return (
    <TouchableOpacity style={styles.placeholderButton} onPress={openModal}>
      <LText style={styles.placeholderLabel}>-</LText>
      <BottomModal
        isOpened={modalOpened}
        onClose={closeModal}
        style={[styles.modal]}
      >
        <Circle bg={colors.lightLive} size={70}>
          <IconHelp size={30} color={colors.live} />
        </Circle>

        <LText style={styles.modalTitle} semiBold>
          <Trans i18nKey="errors.countervaluesUnavailable.title" />
        </LText>
      </BottomModal>
    </TouchableOpacity>
  );
};

export default function CounterValue({
  value: valueProp,
  date,
  withPlaceholder,
  placeholderProps,
  Wrapper,
  currency,
  ...props
}: Props) {
  const value =
    valueProp instanceof BigNumber ? valueProp.toNumber() : valueProp;
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const trackingPairs = useTrackingPairs();
  const cvPolling = useCountervaluesPolling();
  const hasTrackingPair = useMemo(
    () =>
      trackingPairs.some(
        tp => tp.from === currency && tp.to === counterValueCurrency,
      ),
    [counterValueCurrency, currency, trackingPairs],
  );

  useEffect(() => {
    let t;
    if (!hasTrackingPair) {
      addExtraSessionTrackingPair({ from: currency, to: counterValueCurrency });
      t = setTimeout(cvPolling.poll, 2000); // poll after 2s to ensure debounced CV userSettings are effective after this update
    }

    return () => {
      if (t) clearTimeout(t);
    };
  }, [
    counterValueCurrency,
    currency,
    cvPolling,
    cvPolling.poll,
    hasTrackingPair,
    trackingPairs,
  ]);

  const countervalue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value,
    disableRounding: true,
    date,
  });

  if (typeof countervalue !== "number") {
    return withPlaceholder ? <NoCountervaluePlaceholder /> : null;
  }

  const inner = (
    <CurrencyUnitValue
      {...props}
      currency={currency}
      unit={counterValueCurrency.units[0]}
      value={countervalue}
    />
  );

  if (Wrapper) {
    return <Wrapper>{inner}</Wrapper>;
  }

  return inner;
}

const styles = StyleSheet.create({
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
  placeholderLabel: { fontSize: 16 },
});
