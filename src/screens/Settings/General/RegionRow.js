/* @flow */
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import { ScreenName } from "../../../const";
import { localeSelector } from "../../../reducers/settings";
import regionsByKey from "./regions.json";

export default function LanguageSettingsRow() {
  const locale = useSelector(localeSelector);
  const { navigate } = useNavigation();
  return (
    <SettingsRow
      event="LanguageSettingsRow"
      title={<Trans i18nKey="settings.display.region" />}
      desc={<Trans i18nKey="settings.display.regionDesc" />}
      arrowRight
      onPress={() => navigate(ScreenName.RegionSettings)}
      alignedTop
    >
      <LText semiBold color="grey">
        {regionsByKey[locale].regionDisplayName} ({locale})
      </LText>
    </SettingsRow>
  );
}
