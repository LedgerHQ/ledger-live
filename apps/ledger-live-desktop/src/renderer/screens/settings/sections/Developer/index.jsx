// @flow

import React from "react";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import AllowExperimentalAppsToggle from "./AllowExperimentalAppsToggle";
import AllowDebugAppsToggle from "./AllowDebugAppsToggle";
import EnablePlatformDevToolsToggle from "./EnablePlatformDevToolsToggle";
import CatalogProviderInput from "./CatalogProviderInput";
import CatalogRampProviderSelect from "./CatalogRampProviderSelect";
import RunLocalAppButton from "./RunLocalAppButton";
import FeatureFlagsSettings from "./FeatureFlagsSettings";
import EnableLearnPageStagingUrlToggle from "./EnableLearnPageStagingUrlToggle";

const SectionDeveloper = () => {
  const { t } = useTranslation();

  return (
    <>
      <TrackPage category="Settings" name="Developer" />
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

        <Row
          title={t("settings.developer.catalogUrl")}
          desc={t("settings.developer.catalogUrlDesc")}
        >
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
          title={t("settings.developer.enableLearnStagingUrl")}
          desc={t("settings.developer.enableLearnStagingUrlDesc")}
        >
          <EnableLearnPageStagingUrlToggle />
        </Row>
      </Body>
    </>
  );
};

export default SectionDeveloper;
