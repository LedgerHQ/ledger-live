import React from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import {
  NanoSFoldedMedium,
  LifeRingMedium,
  NewsMedium,
  FacebookMedium,
  TwitterMedium,
  GithubMedium,
  ActivityMedium,
} from "@ledgerhq/native-ui/assets/icons";
import SettingsNavigationScrollView from "./SettingsNavigationScrollView";
import SettingsCard from "~/components/SettingsCard";
import { urls } from "~/utils/urls";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

const Resources = () => {
  const { t } = useTranslation();
  const chatbotSupportFeature = useFeature("llmChatbotSupport");

  const gettingStartedUrl = useLocalizedUrl(urls.resources.gettingStarted);
  const helpCenterUrl = useLocalizedUrl(urls.resources.helpCenter);
  const ledgerAcademyUrl = useLocalizedUrl(urls.resources.ledgerAcademy);

  return (
    <SettingsNavigationScrollView>
      <SettingsCard
        title={t("help.gettingStarted.title")}
        desc={t("help.gettingStarted.desc")}
        Icon={NanoSFoldedMedium}
        onClick={() => Linking.openURL(gettingStartedUrl)}
      />
      {chatbotSupportFeature?.enabled ? (
        <SettingsCard
          title={t("help.chatbot")}
          desc={t("help.helpCenter.desc")}
          Icon={LifeRingMedium}
          onClick={() => Linking.openURL(urls.chatbot)}
        />
      ) : (
        <SettingsCard
          title={t("help.helpCenter.title")}
          desc={t("help.helpCenter.desc")}
          Icon={LifeRingMedium}
          onClick={() => Linking.openURL(helpCenterUrl)}
        />
      )}
      <SettingsCard
        title={t("help.ledgerAcademy.title")}
        desc={t("help.ledgerAcademy.desc")}
        Icon={NewsMedium}
        onClick={() => Linking.openURL(ledgerAcademyUrl)}
      />
      <SettingsCard
        title={t("help.facebook.title")}
        desc={t("help.facebook.desc")}
        Icon={FacebookMedium}
        onClick={() => Linking.openURL(urls.resources.facebook)}
      />
      <SettingsCard
        title={t("help.twitter.title")}
        desc={t("help.twitter.desc")}
        Icon={TwitterMedium}
        onClick={() => Linking.openURL(urls.resources.twitter)}
      />
      <SettingsCard
        title={t("help.github.title")}
        desc={t("help.github.desc")}
        Icon={GithubMedium}
        onClick={() => Linking.openURL(urls.resources.github)}
      />
      <SettingsCard
        title={t("help.status.title")}
        desc={t("help.status.desc")}
        Icon={ActivityMedium}
        onClick={() => Linking.openURL(urls.resources.status)}
      />
    </SettingsNavigationScrollView>
  );
};

export default Resources;
