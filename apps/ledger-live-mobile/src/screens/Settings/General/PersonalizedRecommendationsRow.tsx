import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { setPersonalizedRecommendations } from "~/actions/settings";
import { personalizedRecommendationsEnabledSelector } from "~/reducers/settings";
import Track from "~/analytics/Track";
import { updateIdentify } from "~/analytics";

const PersonalizedRecommendationsRow = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const personalizedRecommendationsEnabled: boolean = useSelector(
    personalizedRecommendationsEnabledSelector,
  );

  const togglePersonalizedRecommendations = useCallback(
    (value: boolean) => {
      dispatch(setPersonalizedRecommendations(value));
      updateIdentify();
    },
    [dispatch],
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
          onChange={togglePersonalizedRecommendations}
        />
      </SettingsRow>
    </>
  );
};

export default PersonalizedRecommendationsRow;
