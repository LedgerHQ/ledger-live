import React from "react";
import Main from "LLD/AnalyticsOptInPrompt/screens/VariantA/Main";
import ManagePreferences from "LLD/AnalyticsOptInPrompt/screens/VariantA/ManagePreferences";
import { ManagePreferencesFooter } from "LLD/AnalyticsOptInPrompt/screens/VariantA/ManagePreferences/components";
import { MainFooter } from "LLD/AnalyticsOptInPrompt/screens/VariantA/Main/components";
import useVariantA from "LLD/AnalyticsOptInPrompt/hooks/useVariantA";

interface VariantAProps {
  setPreventBackNavigation: (value: boolean) => void;
  goBackToMain: boolean;
  onSubmit?: () => void;
}

const VariantA = ({ setPreventBackNavigation, goBackToMain, onSubmit }: VariantAProps) => {
  const {
    isManagingPreferences,
    onManagePreferencesClick,
    handleShareAnalyticsChange,
    handleShareCustomAnalyticsChange,
    handlePreferencesChange,
  } = useVariantA({ setPreventBackNavigation, goBackToMain, onSubmit });

  return isManagingPreferences ? (
    <>
      <ManagePreferences onPreferencesChange={handlePreferencesChange} />
      <ManagePreferencesFooter onShareClick={handleShareCustomAnalyticsChange} />
    </>
  ) : (
    <>
      <Main />
      <MainFooter
        setWantToManagePreferences={onManagePreferencesClick}
        onShareAnalyticsChange={handleShareAnalyticsChange}
      />
    </>
  );
};

export default VariantA;
