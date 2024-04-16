import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { setPersonalizedRecommendations } from "~/actions/settings";
import { personalizedRecommendationsEnabledSelector } from "~/reducers/settings";
import Track from "~/analytics/Track";
import { track, updateIdentify } from "~/analytics";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const PersonalizedRecommendationsRow = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const personalizedRecommendationsEnabled = useSelector(
    personalizedRecommendationsEnabledSelector,
  );
  const llmAnalyticsOptInPromptFeature = useFeature("llmAnalyticsOptInPrompt");

  const togglePersonalizedRecommendations = useCallback(
    (value: boolean) => {
      dispatch(setPersonalizedRecommendations(value));
      updateIdentify(undefined, true);
      if (llmAnalyticsOptInPromptFeature?.enabled) {
        track(
          "toggle_clicked",
          {
            enabled: value,
            toggle: "Recommendations",
            page: "Page Settings General",
          },
          true,
        );
      }
    },
    [dispatch, llmAnalyticsOptInPromptFeature?.enabled],
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
