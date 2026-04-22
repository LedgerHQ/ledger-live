import { useCallback } from "react";
import { Linking } from "react-native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import { track } from "~/analytics";
import { ScreenName } from "~/const";

export function useMyWalletHelpViewModel() {
  const chatbotSupportFeature = useFeature("llmChatbotSupport");
  const isChatbotEnabled = chatbotSupportFeature?.enabled ?? false;

  const localizedFaqUrl = useLocalizedUrl(urls.faq);
  const localizedChatbotUrl = useLocalizedUrl(urls.chatbot);
  const localizedAcademyUrl = useLocalizedUrl(urls.resources.ledgerAcademy);

  const onLedgerSupportPress = useCallback(() => {
    track("button_clicked", { button: "LedgerSupport", page: ScreenName.MyWalletHelp });
    Linking.openURL(isChatbotEnabled ? localizedChatbotUrl : localizedFaqUrl);
  }, [isChatbotEnabled, localizedChatbotUrl, localizedFaqUrl]);

  const onLedgerAcademyPress = useCallback(() => {
    track("button_clicked", { button: "LedgerAcademy", page: ScreenName.MyWalletHelp });
    Linking.openURL(localizedAcademyUrl);
  }, [localizedAcademyUrl]);

  return {
    isChatbotEnabled,
    onLedgerSupportPress,
    onLedgerAcademyPress,
  };
}
