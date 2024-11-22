import React from "react";
import { TrackScreen } from "~/analytics";
import CountervalueSettingsRow from "./CountervalueSettingsRow";
import ThemeSettingsRow from "./ThemeSettingsRow";
import AuthSecurityToggle from "./AuthSecurityToggle";
import ReportErrorsRow from "./ReportErrorsRow";
import AnalyticsRow from "./AnalyticsRow";
import LanguageRow from "./LanguageRow";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import DateFormatRow from "./DateFormatRow";
import PersonalizedRecommendationsRow from "./PersonalizedRecommendationsRow";
import WalletSyncRow from "./WalletSyncRow";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import MevProtection from "./MevProtection";

export default function GeneralSettings() {
  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="General" />
      <CountervalueSettingsRow />
      <LanguageRow />
      <DateFormatRow />
      <FeatureToggle featureId="llmWalletSync">
        <WalletSyncRow />
      </FeatureToggle>
      <ThemeSettingsRow />
      <AuthSecurityToggle />
      <FeatureToggle featureId="llMevProtection">
        <MevProtection />
      </FeatureToggle>
      <ReportErrorsRow />
      <AnalyticsRow />
      <FeatureToggle featureId="llmAnalyticsOptInPrompt">
        <PersonalizedRecommendationsRow />
      </FeatureToggle>
    </SettingsNavigationScrollView>
  );
}
