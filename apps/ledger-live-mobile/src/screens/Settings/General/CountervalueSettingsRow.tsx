import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { counterValueCurrencySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import { ScreenName } from "../../../const";

export default function CountervalueSettingsRow() {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { navigate } = useNavigation();

  const { t } = useTranslation();

  return (
    <SettingsRow
      event="CountervalueSettingsRow"
      title={t("settings.display.counterValue")}
      desc={t("settings.display.counterValueDesc")}
      arrowRight
      onPress={() => navigate(ScreenName.CountervalueSettings)}
    >
      <Text variant={"body"} fontWeight={"medium"} color="primary.c80">
        {counterValueCurrency.ticker}
      </Text>
    </SettingsRow>
  );
}
