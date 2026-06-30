import React from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { userIdSelector } from "@ledgerhq/client-ids/store";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import AllowExperimentalAppsToggle from "./AllowExperimentalAppsToggle";
import AllowDebugAppsToggle from "./AllowDebugAppsToggle";
import EnablePlatformDevToolsToggle from "./EnablePlatformDevToolsToggle";
import CatalogProviderInput from "./CatalogProviderInput";
import CustomLockScreenToggle from "./CustomLockScreenToggle";
import CustomLockScreenAssets from "./CustomLockScreenAssets";
import RunLocalAppButton from "./RunLocalAppButton";
import FeatureFlagsSettings from "./FeatureFlagsSettings";
import CoinConfigSettings from "./CoinConfigSettings";
import EnableLearnPageStagingUrlToggle from "./EnableLearnPageStagingUrlToggle";
import EnableCountervaluesStagingToggle from "./EnableCountervaluesStagingToggle";
import OnboardingAppInstallDebugButton from "./OnboardingAppInstallDebug";
import ExchangeDeveloperMode from "./ExchangeDeveloperMode";
import ExchangeTestPartnerMode from "./ExchangeTestPartnerMode";
import LottieTester from "./LottieTester";
import PostOnboardingHubTester from "./PostOnboardingHubTester";
import AllowDebugReactQueryToggle from "./AllowDebugReactQueryToggle";
import { FeatureToggle } from "@features/platform-feature-flags";
import WalletSyncTester from "./WalletSync/WalletSyncTester";
import MockAppUpdate from "./MockAppUpdate";
import EnableAnalyticsConsole from "./EnableAnalyticsConsole";
import EnableThemeConsole from "./EnableThemeConsole";
import BrazeTools from "./BrazeTools";
import { RecoverUpsellRow } from "./RecoverUpsellRow";
import CustomCALRefInput from "./CustomCALRefInput";
import EnvVariableOverride from "./EnvVariableOverride";
import ModularDrawerDevTool from "./ModularDrawer";
import CryptoAssetsListDevTool from "./CryptoAssetsList";
import { MockAccountGeneratorSection } from "./GenerateMockAccounts";
import AppJsonImporter from "./AppJsonImporter";
import CustomLockScreenTester from "./CustomLockScreenTester";
import WalletFeaturesDevTool from "./WalletFeaturesDevTool";
import FeaturesAndFlowsDevTool from "./FeaturesAndFlowsDevTool";
import AnalyticsConsentOptInDevTool from "./AnalyticsConsentOptInDevTool";
import { AnalyticsConsentOptInDevScreen } from "./AnalyticsConsentOptInDevTool/AnalyticsConsentOptInDevScreen";
import GenericAwarenessModalDevTool from "./GenericAwarenessModalDevTool";
import GenericAwarenessModalDevScreen from "./GenericAwarenessModalDevTool/screens/GenericAwarenessModalDevScreen";
import InfoStateDevTool from "./InfoStateDevTool";
import InfoStateDevScreen from "./InfoStateDevTool/screens/InfoStateDevScreen";

const Default = () => {
  const { t } = useTranslation();
  const userId = useSelector(userIdSelector);
  const segmentId = userId.exportUserIdForAnalytics();

  return (
    <Body>
      <Row title={t("settings.developer.userId")} desc={segmentId} dataTestId="developer-user-id" />

      <Row title={t("settings.developer.debugApps")} desc={t("settings.developer.debugAppsDesc")}>
        <AllowDebugAppsToggle />
      </Row>

      <Row
        title={t("settings.developer.experimentalApps")}
        desc={t("settings.developer.experimentalAppsDesc")}
      >
        <AllowExperimentalAppsToggle />
      </Row>

      <Row
        title={t("settings.developer.mockAppUpdate")}
        desc={t("settings.developer.mockAppUpdateDesc")}
      >
        <MockAppUpdate />
      </Row>

      <Row title={t("settings.developer.catalogUrl")} desc={t("settings.developer.catalogUrlDesc")}>
        <CatalogProviderInput />
      </Row>

      <Row
        title={t("settings.developer.customCALRef")}
        desc={t("settings.developer.customCALRefDesc")}
      >
        <CustomCALRefInput />
      </Row>

      <Row
        title={t("settings.developer.enablePlatformDevTools")}
        desc={t("settings.developer.enablePlatformDevToolsDesc")}
      >
        <EnablePlatformDevToolsToggle />
      </Row>
      <Row
        title={t("settings.developer.analyticsConsole.title")}
        desc={t("settings.developer.analyticsConsole.desc")}
      >
        <EnableAnalyticsConsole />
      </Row>
      <Row
        title={t("settings.developer.themeConsole.title")}
        desc={t("settings.developer.themeConsole.desc")}
      >
        <EnableThemeConsole />
      </Row>
      <RunLocalAppButton />
      <CustomLockScreenTester />
      <CustomLockScreenToggle />
      <FeatureFlagsSettings />
      <CoinConfigSettings />
      {__DEV__ && <EnvVariableOverride />}
      <Row
        title={t("settings.developer.enableLearnStagingUrl")}
        desc={t("settings.developer.enableLearnStagingUrlDesc")}
      >
        <EnableLearnPageStagingUrlToggle />
      </Row>
      <Row
        title={t("settings.developer.enableCountervaluesStaging")}
        desc={t("settings.developer.enableCountervaluesStagingDesc")}
      >
        <EnableCountervaluesStagingToggle />
      </Row>
      <RecoverUpsellRow />

      <Row
        title={t("settings.developer.openOnboardingAppInstallDebug")}
        desc={t("settings.developer.openOnboardingAppInstallDebugDesc")}
      >
        <OnboardingAppInstallDebugButton />
      </Row>
      <LottieTester />
      <PostOnboardingHubTester />
      <ExchangeDeveloperMode />
      <ExchangeTestPartnerMode />
      <FeatureToggle featureId="lldWalletSync">
        <WalletSyncTester />
      </FeatureToggle>

      <BrazeTools />

      {__DEV__ && (
        <Row
          title={t("settings.developer.debugReactQuery")}
          desc={t("settings.developer.debugReactQueryDesc")}
        >
          <AllowDebugReactQueryToggle />
        </Row>
      )}
      <WalletFeaturesDevTool />
      <FeaturesAndFlowsDevTool />
      <AnalyticsConsentOptInDevTool />
      <GenericAwarenessModalDevTool />
      <InfoStateDevTool />
      <ModularDrawerDevTool />
      <CryptoAssetsListDevTool />
      <MockAccountGeneratorSection />
      <AppJsonImporter />
    </Body>
  );
};
const SectionDeveloper = () => (
  <>
    <TrackPage category="Settings" name="Developer" />
    <Routes>
      <Route path="custom-locksscreen-assets" element={<CustomLockScreenAssets />} />
      <Route path="analytics-consent-opt-in-qa" element={<AnalyticsConsentOptInDevScreen />} />
      <Route path="generic-awareness-modal-qa" element={<GenericAwarenessModalDevScreen />} />
      <Route path="info-state-qa" element={<InfoStateDevScreen />} />
      <Route path="*" element={<Default />} />
    </Routes>
  </>
);
export default SectionDeveloper;
