import React, { useCallback, useEffect, useState } from "react";
import Main from "LLD/AnalyticsOptInPrompt/screens/VariantA/Main";
import ManagePreferences from "LLD/AnalyticsOptInPrompt/screens/VariantA/ManagePreferences";
import { ManagePreferencesFooter } from "LLD/AnalyticsOptInPrompt/screens/VariantA/ManagePreferences/components";
import { MainFooter } from "LLD/AnalyticsOptInPrompt/screens/VariantA/Main/components";
import {
  setShareAnalytics,
  setSharePersonalizedRecommandations,
} from "~/renderer/actions/settings";
import { useDispatch } from "react-redux";
import { FieldKeySwitch } from "~/newArch/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";

interface ManagePreferencesScreenProps {
  setShareAnalytics: (value: boolean) => void;
  onPreferencesChange: (preferences: Record<FieldKeySwitch, boolean>) => void;
}

const ManagePreferencesScreen = ({
  setShareAnalytics,
  onPreferencesChange,
}: ManagePreferencesScreenProps) => (
  <>
    <ManagePreferences onPreferencesChange={onPreferencesChange} />
    <ManagePreferencesFooter onShareClick={setShareAnalytics} />
  </>
);

interface MainScreenProps {
  onManagePreferencesClick: () => void;
  onShareAnalyticsChange: (value: boolean) => void;
}

const MainScreen = ({ onManagePreferencesClick, onShareAnalyticsChange }: MainScreenProps) => (
  <>
    <Main />
    <MainFooter
      setWantToManagePreferences={onManagePreferencesClick}
      onShareAnalyticsChange={onShareAnalyticsChange}
    />
  </>
);

interface UseVariantAProps {
  setPreventBackNavigation: (value: boolean) => void;
  goBackToMain: boolean;
  onSubmit?: () => void;
}

const useVariantA = ({ setPreventBackNavigation, goBackToMain, onSubmit }: UseVariantAProps) => {
  const dispatch = useDispatch();

  const [isManagingPreferences, setIsManagingPreferences] = useState(false);
  const [preferences, setPreferences] = useState<Record<FieldKeySwitch, boolean>>({
    AnalyticsData: false,
    PersonalizationData: false,
  });

  const onManagePreferencesClick = useCallback(() => {
    setIsManagingPreferences(true);
    setPreventBackNavigation(true);
  }, [setPreventBackNavigation]);

  useEffect(() => {
    if (goBackToMain) setIsManagingPreferences(false);
  }, [goBackToMain]);

  const handleShareAnalyticsChange = (value: boolean) => {
    dispatch(setSharePersonalizedRecommandations(value));
    dispatch(setShareAnalytics(value));
    onSubmit?.();
  };

  const handleShareCustomAnalyticsChange = (value: boolean) => {
    if (value) {
      const { AnalyticsData, PersonalizationData } = preferences;
      dispatch(setShareAnalytics(AnalyticsData));
      dispatch(setSharePersonalizedRecommandations(PersonalizationData));
      onSubmit?.();
    }
  };

  const handlePreferencesChange = (preferences: Record<FieldKeySwitch, boolean>) => {
    setPreferences(preferences);
  };

  const screen = isManagingPreferences ? (
    <ManagePreferencesScreen
      setShareAnalytics={handleShareCustomAnalyticsChange}
      onPreferencesChange={handlePreferencesChange}
    />
  ) : (
    <MainScreen
      onManagePreferencesClick={onManagePreferencesClick}
      onShareAnalyticsChange={handleShareAnalyticsChange}
    />
  );
  return { screen, setIsManagingPreferences };
};

export default useVariantA;
