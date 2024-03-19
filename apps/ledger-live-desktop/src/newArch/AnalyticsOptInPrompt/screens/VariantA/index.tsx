import React from "react";
import Main from "LLD/AnalyticsOptInPrompt/screens/VariantA/Main";
import ManagePreferences from "LLD/AnalyticsOptInPrompt/screens/VariantA/ManagePreferences";
import { ManagePreferencesFooter } from "LLD/AnalyticsOptInPrompt/screens/VariantA/ManagePreferences/components";
import { MainFooter } from "LLD/AnalyticsOptInPrompt/screens/VariantA/Main/components";
import useVariantA from "LLD/AnalyticsOptInPrompt/hooks/useVariantA";
import { EntryPoint } from "LLD/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";

interface VariantAProps {
  onSubmit?: () => void;
  entryPoint: EntryPoint;
  step: number;
  setStep: (value: number) => void;
}

const VariantA = ({ onSubmit, entryPoint, step, setStep }: VariantAProps) => {
  const {
    onManagePreferencesClick,
    handleShareAnalyticsChange,
    handleShareCustomAnalyticsChange,
    handlePreferencesChange,
    shouldWeTrack,
    handleOpenPrivacyPolicy,
  } = useVariantA({
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

export default VariantA;
