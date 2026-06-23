import React from "react";
import Main from "LLD/features/AnalyticsOptInPrompt/screens/AnalyticsOptInScreen/Main";
import ManagePreferences from "LLD/features/AnalyticsOptInPrompt/screens/AnalyticsOptInScreen/ManagePreferences";
import { ManagePreferencesFooter } from "LLD/features/AnalyticsOptInPrompt/screens/AnalyticsOptInScreen/ManagePreferences/components";
import { MainFooter } from "LLD/features/AnalyticsOptInPrompt/screens/AnalyticsOptInScreen/Main/components";
import { EntryPoint } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import useAnalyticsOptInViewModel from "./useAnalyticsOptInViewModel";

interface AnlyticsOptInProps {
  onSubmit?: () => void;
  entryPoint: EntryPoint;
  step: number;
  setStep: (value: number) => void;
}

const AnalyticsOptIn = ({ onSubmit, entryPoint, step, setStep }: AnlyticsOptInProps) => {
  const {
    onManagePreferencesClick,
    handleShareAnalyticsChange,
    handleShareCustomAnalyticsChange,
    handlePreferencesChange,
    shouldWeTrack,
    handleOpenPrivacyPolicy,
  } = useAnalyticsOptInViewModel({
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

export default AnalyticsOptIn;
