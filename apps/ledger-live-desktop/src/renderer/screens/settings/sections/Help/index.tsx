import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { urls } from "~/config/urls";
import { languageSelector, swapKYCSelector } from "~/renderer/reducers/settings";
import TrackPage from "~/renderer/analytics/TrackPage";
import ExportLogsBtn from "~/renderer/components/ExportLogsButton";
import TroubleshootNetworkBtn from "~/renderer/components/TroubleshootNetworkButton";
import OpenUserDataDirectoryBtn from "~/renderer/components/OpenUserDataDirectoryBtn";
import RowItem from "../../RowItem";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import CleanButton from "./CleanButton";
import ResetButton from "./ResetButton";
import ResetKYCButton from "./ResetKYCButton";
import RepairDeviceButton from "./RepairDeviceButton";
import LaunchOnboardingBtn from "./LaunchOnboardingBtn";
const SectionHelp = () => {
  const { t } = useTranslation();
  const swapKYC = useSelector(swapKYCSelector);
  const locale = useSelector(languageSelector) || "en";
  const hasSwapLoginOrKYCInfo = Object.keys(swapKYC).length !== 0;
  return (
    <>
      <TrackPage category="Settings" name="Help" />
      <Body>
        <RowItem
          title={t("settings.help.faq")}
          desc={t("settings.help.faqDesc")}
          url={urls.faq[locale in urls.faq ? locale : "en"]}
        />
        <Row
          title={t("settings.profile.softResetTitle")}
          desc={t("settings.profile.softResetDesc")}
        >
          <CleanButton />
        </Row>
        <Row title={t("settings.exportLogs.title")} desc={t("settings.exportLogs.desc")}>
          <ExportLogsBtn />
        </Row>
        <Row
          title={t("settings.troubleshootNetwork.title")}
          desc={t("settings.troubleshootNetwork.desc")}
        >
          <TroubleshootNetworkBtn />
        </Row>
        <Row
          title={t("settings.profile.launchOnboarding")}
          desc={t("settings.profile.launchOnboardingDesc")}
        >
          <LaunchOnboardingBtn />
        </Row>
        <Row
          title={t("settings.openUserDataDirectory.title")}
          desc={t("settings.openUserDataDirectory.desc")}
        >
          <OpenUserDataDirectoryBtn primary small />
        </Row>
        <Row
          title={t("settings.repairDevice.title")}
          desc={t("settings.repairDevice.descSettings")}
        >
          <RepairDeviceButton
            buttonProps={{
              small: true,
              primary: true,
            }}
          />
        </Row>
        {hasSwapLoginOrKYCInfo ? (
          <Row
            title={t("settings.profile.resetThirdPartyData")}
            desc={t("settings.profile.resetThirdPartyDataDesc")}
          >
            <ResetKYCButton />
          </Row>
        ) : null}
        <Row
          title={t("settings.profile.hardResetTitle")}
          desc={t("settings.profile.hardResetDesc")}
        >
          <ResetButton />
        </Row>
      </Body>
    </>
  );
};
export default SectionHelp;
