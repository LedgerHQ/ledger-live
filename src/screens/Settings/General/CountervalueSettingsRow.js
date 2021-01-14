/* @flow */
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { counterValueCurrencySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import { ScreenName } from "../../../const";

export default function CountervalueSettingsRow() {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { navigate } = useNavigation();

  return (
    <SettingsRow
      event="CountervalueSettingsRow"
      title={<Trans i18nKey="settings.display.counterValue" />}
      desc={<Trans i18nKey="settings.display.counterValueDesc" />}
      arrowRight
      onPress={() => navigate(ScreenName.CountervalueSettings)}
      alignedTop
    >
      <LText semiBold color="grey">
        {counterValueCurrency.ticker}
      </LText>
    </SettingsRow>
  );
}
