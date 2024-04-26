import React, { memo } from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { urls } from "~/utils/urls";
import SettingsRow from "~/components/SettingsRow";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

function LedgerSupportRow() {
  const chatbotSupportFeature = useFeature("llmChatbotSupport");

  return chatbotSupportFeature?.enabled ? (
    <SettingsRow
      event="LedgerSupportChatbotRow"
      title={<Trans i18nKey="help.chatbot" />}
      desc={<Trans i18nKey="settings.help.supportDesc" />}
      onPress={() => Linking.openURL(urls.chatbot)}
    >
      <ExternalLinkMedium size={20} color={"neutral.c100"} />
    </SettingsRow>
  ) : (
    <SettingsRow
      event="LedgerSupportRow"
      title={<Trans i18nKey="settings.help.support" />}
      desc={<Trans i18nKey="settings.help.supportDesc" />}
      onPress={() => Linking.openURL(urls.faq)}
    >
      <ExternalLinkMedium size={20} color={"neutral.c100"} />
    </SettingsRow>
  );
}

export default memo(LedgerSupportRow);
