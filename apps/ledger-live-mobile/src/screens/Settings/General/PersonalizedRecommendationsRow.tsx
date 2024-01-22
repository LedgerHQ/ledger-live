import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { setPersonalizedRecommendations } from "~/actions/settings";
import { personalizedRecommendationsEnabledSelector } from "~/reducers/settings";
import Track from "~/analytics/Track";

const PersonalizedRecommendationsRow = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const personalizedRecommendationsEnabled: boolean = useSelector(
    personalizedRecommendationsEnabledSelector,
  );

  return (
    <>
      <Track
        event={
          personalizedRecommendationsEnabled
            ? "EnablePersonalizedRecommendations"
            : "DisablePersonalizedRecommendations"
        }
        onUpdate
      />
      <SettingsRow
        event="PersonalizedRecommendationsRow"
        title={t("settings.display.personalizedRecommendations")}
        desc={t("settings.display.personalizedRecommendationsDesc")}
      >
        <Switch
          checked={personalizedRecommendationsEnabled}
          onChange={value => dispatch(setPersonalizedRecommendations(value))}
        />
      </SettingsRow>
    </>
  );
};

export default PersonalizedRecommendationsRow;
