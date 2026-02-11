import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route } from "react-router";
import user from "~/helpers/user";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SettingsSectionBody as Body } from "../../SettingsSection";
import AllowExperimentalAppsToggle from "./tools/AllowExperimentalAppsToggle";
import AllowDebugAppsToggle from "./tools/AllowDebugAppsToggle";
import EnablePlatformDevToolsToggle from "./tools/EnablePlatformDevToolsToggle";
import CatalogProviderInput from "./tools/CatalogProviderInput";
import CustomLockScreenToggle from "./tools/CustomLockScreenToggle";
import CustomLockScreenAssets from "./tools/CustomLockScreenAssets";
import RunLocalAppButton from "./tools/RunLocalAppButton";
import FeatureFlagsSettings from "./tools/FeatureFlagsSettings";
import EnableLearnPageStagingUrlToggle from "./tools/EnableLearnPageStagingUrlToggle";
import EnableCountervaluesStagingToggle from "./tools/EnableCountervaluesStagingToggle";
import OnboardingAppInstallDebugButton from "./tools/OnboardingAppInstallDebug";
import ExchangeDeveloperMode from "./tools/ExchangeDeveloperMode";
import ExchangeTestPartnerMode from "./tools/ExchangeTestPartnerMode";
import LottieTester from "./tools/LottieTester";
import PostOnboardingHubTester from "./tools/PostOnboardingHubTester";
import AllowDebugReactQueryToggle from "./tools/AllowDebugReactQueryToggle";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import WalletSyncTester from "./tools/WalletSync";
import MockAppUpdate from "./tools/MockAppUpdate";
import EnableAnalyticsConsole from "./tools/EnableAnalyticsConsole";
import EnableThemeConsole from "./tools/EnableThemeConsole";
import BrazeTools from "./tools/BrazeTools";
import { RecoverUpsellRow } from "./tools/RecoverUpsellRow";
import CustomCALRefInput from "./tools/CustomCALRefInput";
import EnvVariableOverride from "./tools/EnvVariableOverride";
import ModularDrawerDevTool from "./tools/ModularDrawer/index";
import CryptoAssetsListDevTool from "./tools/CryptoAssetsList";
import { MockAccountGeneratorSection } from "./tools/GenerateMockAccounts";
import CustomLockScreenTester from "./tools/CustomLockScreenTester";
import WalletFeaturesDevTool from "./tools/WalletFeaturesDevTool/index";
import { DeveloperInfoRow } from "./components";

const Default = () => {
  const { t } = useTranslation();
  const [segmentId, setSegmentID] = useState("loading...");

  useEffect(() => {
    user().then(u => {
      setSegmentID(u.id);
    });
  }, []);

  return (
    <Body>
      <DeveloperInfoRow
        title={t("settings.developer.userId")}
        value={segmentId}
        dataTestId="developer-user-id"
      />

      <AllowDebugAppsToggle />
      <AllowExperimentalAppsToggle />
      <MockAppUpdate />

      <CatalogProviderInput />
      <CustomCALRefInput />

      <EnablePlatformDevToolsToggle />
      <EnableAnalyticsConsole />
      <EnableThemeConsole />
      <RunLocalAppButton />
      <CustomLockScreenTester />
      <CustomLockScreenToggle />
      <FeatureFlagsSettings />
      {__DEV__ && <EnvVariableOverride />}
      <EnableLearnPageStagingUrlToggle />
      <EnableCountervaluesStagingToggle />
      <RecoverUpsellRow />

      <OnboardingAppInstallDebugButton />
      <LottieTester />
      <PostOnboardingHubTester />
      <ExchangeDeveloperMode />
      <ExchangeTestPartnerMode />
      <FeatureToggle featureId="lldWalletSync">
        <WalletSyncTester />
      </FeatureToggle>

      <BrazeTools />

      {__DEV__ && <AllowDebugReactQueryToggle />}
      <WalletFeaturesDevTool />
      <ModularDrawerDevTool />
      <CryptoAssetsListDevTool />
      <MockAccountGeneratorSection />
    </Body>
  );
};
const SectionDeveloper = () => (
  <>
    <TrackPage category="Settings" name="Developer" />
    <Routes>
      <Route path="custom-locksscreen-assets" element={<CustomLockScreenAssets />} />
      <Route path="*" element={<Default />} />
    </Routes>
  </>
);
export default SectionDeveloper;
