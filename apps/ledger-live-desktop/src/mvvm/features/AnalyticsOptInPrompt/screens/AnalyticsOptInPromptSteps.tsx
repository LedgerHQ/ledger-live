import React from "react";
import Main from "LLD/features/AnalyticsOptInPrompt/screens/Main";
import ManagePreferences from "LLD/features/AnalyticsOptInPrompt/screens/ManagePreferences";
import { ManagePreferencesFooter } from "LLD/features/AnalyticsOptInPrompt/screens/ManagePreferences/components";
import { MainFooter } from "LLD/features/AnalyticsOptInPrompt/screens/Main/components";
import { useAnalyticsOptInPromptSteps } from "LLD/features/AnalyticsOptInPrompt/hooks/useAnalyticsOptInPromptSteps";
import { EntryPoint } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";

interface AnalyticsOptInPromptStepsProps {
  onSubmit?: () => void;
  entryPoint: EntryPoint;
  step: number;
  setStep: (value: number) => void;
}

const AnalyticsOptInPromptSteps = ({
  onSubmit,
  entryPoint,
  step,
  setStep,
}: AnalyticsOptInPromptStepsProps) => {
  const {
    onManagePreferencesClick,
    handleShareAnalyticsChange,
    handleShareCustomAnalyticsChange,
    handlePreferencesChange,
    shouldWeTrack,
    handleOpenPrivacyPolicy,
  } = useAnalyticsOptInPromptSteps({
    onSubmit,
    entryPoint,
    setStep,
  });

  return step === 0 ? (
    <>
      <Main shouldWeTrack={shouldWeTrack} handleOpenPrivacyPolicy={handleOpenPrivacyPolicy} />
      <MainFooter
        setWantToManagePreferences={onManagePreferencesClick}
        onShareAnalyticsChange={handleShareAnalyticsChange}
      />
    </>
  ) : (
    <>
      <ManagePreferences
        onPreferencesChange={handlePreferencesChange}
        shouldWeTrack={shouldWeTrack}
        handleOpenPrivacyPolicy={handleOpenPrivacyPolicy}
      />
      <ManagePreferencesFooter onShareClick={handleShareCustomAnalyticsChange} />
    </>
  );
};

export default AnalyticsOptInPromptSteps;
