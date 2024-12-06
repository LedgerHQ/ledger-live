import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import CounterValueSelect from "./CounterValueSelect";
import LanguageSelect from "./LanguageSelect";
import RegionSelect from "./RegionSelect";
import ThemeSelect from "./ThemeSelect";
import WalletSync from "./WalletSync";
import PasswordButton from "./PasswordButton";
import PasswordAutoLockSelect from "./PasswordAutoLockSelect";
import SentryLogsButton from "./SentryLogsButton";
import ShareAnalyticsButton from "./ShareAnalyticsButton";
import SharePersonnalRecoButtonFF from "./SharePersonalRecoButtonFF";
import ShareAnalyticsButtonFF from "./ShareAnalyticsButtonFF";
import { hasPasswordSelector } from "~/renderer/reducers/application";
import { useInitSupportedCounterValues } from "~/renderer/hooks/useInitSupportedCounterValues";
import { FeatureToggle, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import MarketPerformanceWidgetRow from "./MarketPerformanceWidget";
import MevProtectionRow from "./MevProtection";

const SectionGeneral = () => {
  const hasPassword = useSelector(hasPasswordSelector);
  const { t } = useTranslation();
  useInitSupportedCounterValues();
  const lldAnalyticsOptInPromptFlag = useFeature("lldAnalyticsOptInPrompt");

  return (
    <>
      <TrackPage category="Settings" name="Display" />
      <Body>
        <Row
          title={t("settings.display.counterValue")}
          desc={t("settings.display.counterValueDesc")}
          dataTestId="setting-countervalue-dropDown"
        >
          <CounterValueSelect />
        </Row>

        <Row
          title={t("settings.display.language")}
          desc={t("settings.display.languageDesc")}
          dataTestId="setting-language-dropDown"
        >
          <LanguageSelect />
        </Row>

        <Row title={t("settings.display.region")} desc={t("settings.display.regionDesc")}>
          <RegionSelect />
        </Row>

        <Row
          title={t("settings.display.theme")}
          desc={t("settings.display.themeDesc")}
          dataTestId="setting-theme-dropDown"
        >
          <ThemeSelect />
        </Row>

        <FeatureToggle featureId="lldWalletSync">
          <Row
            title={t("settings.display.walletSync")}
            desc={t("settings.display.walletSyncDesc")}
            dataTestId="setting-walletSync"
            id="setting-walletSync"
          >
            <WalletSync />
          </Row>
        </FeatureToggle>

        <FeatureToggle featureId="marketperformanceWidgetDesktop">
          <Row
            title={t("settings.display.marketPerformanceWidget")}
            desc={t("settings.display.marketPerformanceWidgetDesc")}
            dataTestId="setting-marketPerformanceWidget"
          >
            <MarketPerformanceWidgetRow />
          </Row>
        </FeatureToggle>

        <Row title={t("settings.profile.password")} desc={t("settings.profile.passwordDesc")}>
          <PasswordButton />
        </Row>
        {hasPassword ? (
          <Row
            title={t("settings.profile.passwordAutoLock")}
            desc={t("settings.profile.passwordAutoLockDesc")}
          >
            <PasswordAutoLockSelect />
          </Row>
        ) : null}

        <FeatureToggle featureId="llMevProtection">
          <Row
            title={t("settings.display.mevProtection")}
            desc={t("settings.display.mevProtectionDesc")}
            dataTestId="setting-mevProtection"
            id="setting-mevProtection"
          >
            <MevProtectionRow />
          </Row>
        </FeatureToggle>

        <Row
          title={t("settings.profile.reportErrors")}
          desc={t("settings.profile.reportErrorsDesc")}
        >
          <SentryLogsButton />
        </Row>
        {lldAnalyticsOptInPromptFlag?.enabled ? (
          <>
            <Row
              title={t("analyticsOptInPrompt.profileSettings.analytics")}
              desc={t("analyticsOptInPrompt.profileSettings.analyticsDesc")}
            >
              <ShareAnalyticsButtonFF />
            </Row>
            <Row
              title={t("analyticsOptInPrompt.profileSettings.personalizedExp")}
              desc={t("analyticsOptInPrompt.profileSettings.personalizedExpDesc")}
            >
              <SharePersonnalRecoButtonFF />
            </Row>
          </>
        ) : (
          <Row title={t("settings.profile.analytics")} desc={t("settings.profile.analyticsDesc")}>
            <ShareAnalyticsButton />
          </Row>
        )}
      </Body>
    </>
  );
};
export default SectionGeneral;
