// @flow

import React from "react";
import { useTranslation } from "react-i18next";
import { Switch, Route } from "react-router-dom";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import AllowExperimentalAppsToggle from "./AllowExperimentalAppsToggle";
import AllowDebugAppsToggle from "./AllowDebugAppsToggle";
import EnablePlatformDevToolsToggle from "./EnablePlatformDevToolsToggle";
import CatalogProviderInput from "./CatalogProviderInput";
import CustomLockScreenToggle from "./CustomLockScreenToggle";
import CustomLockScreen from "./CustomLockScreen";
import CatalogRampProviderSelect from "./CatalogRampProviderSelect";
import RunLocalAppButton from "./RunLocalAppButton";
import FeatureFlagsSettings from "./FeatureFlagsSettings";
import EnableLearnPageStagingUrlToggle from "./EnableLearnPageStagingUrlToggle";
import OnboardingAppInstallDebugButton from "./OnboardingAppInstallDebug";

const Default = () => {
  const { t } = useTranslation();
  return (
    <Body>
      <Row title={t("settings.developer.debugApps")} desc={t("settings.developer.debugAppsDesc")}>
        <AllowDebugAppsToggle />
      </Row>

      <Row
        title={t("settings.developer.experimentalApps")}
        desc={t("settings.developer.experimentalAppsDesc")}
      >
        <AllowExperimentalAppsToggle />
      </Row>

      <Row title={t("settings.developer.catalogUrl")} desc={t("settings.developer.catalogUrlDesc")}>
        <CatalogProviderInput />
      </Row>

      <Row
        title={t("settings.developer.catalogRampServer")}
        desc={t("settings.developer.catalogRampServerDesc")}
      >
        <CatalogRampProviderSelect />
      </Row>

      <Row
        title={t("settings.developer.enablePlatformDevTools")}
        desc={t("settings.developer.enablePlatformDevToolsDesc")}
      >
        <EnablePlatformDevToolsToggle />
      </Row>
      <RunLocalAppButton />
      <FeatureFlagsSettings />
      <Row
        title={t("settings.developer.openOnboardingAppInstallDebug")}
        desc={t("settings.developer.openOnboardingAppInstallDebugDesc")}
      >
        <OnboardingAppInstallDebugButton />
      </Row>
      <Row
        title={t("settings.developer.enablePlatformDevTools")}
        desc={t("settings.developer.enablePlatformDevToolsDesc")}
      >
        <EnablePlatformDevToolsToggle />
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
    </Body>
  );
};

const SectionDeveloper = () => (
  <>
    <TrackPage category="Settings" name="Developer" />
    <Switch>
      <Route path="/settings/developer/custom-locksscreen-assets" component={CustomLockScreen} />
      <Route component={Default} />
    </Switch>
  </>
);
export default SectionDeveloper;
