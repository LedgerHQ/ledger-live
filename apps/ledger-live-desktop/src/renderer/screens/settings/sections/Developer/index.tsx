import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch, Route } from "react-router-dom";
import user from "~/helpers/user";
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
import EnableLearnPageStagingUrlToggle from "./EnableLearnPageStagingUrlToggle";
import OnboardingAppInstallDebugButton from "./OnboardingAppInstallDebug";
import EnableStagingNftMetadataServiceToggle from "./EnableStagingNftMetadataServiceToggle";
import ExchangeDeveloperMode from "./ExchangeDeveloperMode";
import LottieTester from "../Experimental/LottieTester";
import StorylyTester from "../Experimental/StorylyTester";
import PostOnboardingHubTester from "../Experimental/PostOnboardingHubTester";
import AllowDebugReactQueryToggle from "./AllowDebugReactQueryToggle";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import WalletSyncTester from "./WalletSync/WalletSyncTester";
import SimpleHashTools from "./SimpleHashTools/SimpleHashTools";
import MockAppUpdate from "./MockAppUpdate";
import EnableAnalyticsConsole from "./EnableAnalyticsConsole";
import BrazeTools from "./BrazeTools";
import { RecoverUpsellRow } from "./RecoverUpsellRow";

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
      <Row title={t("settings.developer.userId")} desc={segmentId} />

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
      <RunLocalAppButton />
      <CustomLockScreenToggle />
      <FeatureFlagsSettings />
      <Row
        title={t("settings.developer.enableLearnStagingUrl")}
        desc={t("settings.developer.enableLearnStagingUrlDesc")}
      >
        <EnableLearnPageStagingUrlToggle />
      </Row>
      <RecoverUpsellRow />
      <Row
        title={t("settings.developer.enableStagingNftMetadataService")}
        desc={t("settings.developer.enableStagingNftMetadataServiceDesc")}
      >
        <EnableStagingNftMetadataServiceToggle />
      </Row>
      <Row
        title={t("settings.developer.openOnboardingAppInstallDebug")}
        desc={t("settings.developer.openOnboardingAppInstallDebugDesc")}
      >
        <OnboardingAppInstallDebugButton />
      </Row>
      <LottieTester />
      <PostOnboardingHubTester />
      <FeatureToggle featureId="storyly">
        <StorylyTester />
      </FeatureToggle>
      <ExchangeDeveloperMode />

      <FeatureToggle featureId="lldWalletSync">
        <WalletSyncTester />
      </FeatureToggle>

      <SimpleHashTools />
      <BrazeTools />

      {__DEV__ && (
        <Row
          title={t("settings.developer.debugReactQuery")}
          desc={t("settings.developer.debugReactQueryDesc")}
        >
          <AllowDebugReactQueryToggle />
        </Row>
      )}
    </Body>
  );
};
const SectionDeveloper = () => (
  <>
    <TrackPage category="Settings" name="Developer" />
    <Switch>
      <Route
        path="/settings/developer/custom-locksscreen-assets"
        component={CustomLockScreenAssets}
      />
      <Route component={Default} />
    </Switch>
  </>
);
export default SectionDeveloper;
