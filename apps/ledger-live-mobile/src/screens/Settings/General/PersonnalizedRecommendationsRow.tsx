import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { setPersonnalizedRecommendations } from "~/actions/settings";
import { personnalizedRecommendationsEnabledSelector } from "~/reducers/settings";
import Track from "~/analytics/Track";

const PersonnalizedRecommendationsRow = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const personnalizedRecommendationsEnabled: boolean = useSelector(personnalizedRecommendationsEnabledSelector);

  return (
    <>
      <Track event={personnalizedRecommendationsEnabled ? "EnablePersonnalizedRecommendations" : "DisablePersonnalizedRecommendations"} onUpdate />
      <SettingsRow
        event="PersonnalizedRecommendationsRow"
        title={t("settings.display.personnalizedRecommendations")}
        desc={t("settings.display.personnalizedRecommendationsDesc")}
      >
        <Switch checked={personnalizedRecommendationsEnabled} onChange={value => dispatch(setPersonnalizedRecommendations(value))} />
      </SettingsRow>
    </>
  );
};

export default PersonnalizedRecommendationsRow;
