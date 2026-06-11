import { useCallback, useState } from "react";
import { Linking } from "react-native";
import { useFeature } from "@features/platform-feature-flags";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useCleanCache } from "~/actions/general";
import { reboot } from "~/actions/appstate";
import { useDispatch } from "~/context/hooks";
import useExportLogs from "~/components/useExportLogs";
import { urls } from "~/utils/urls";
import { track } from "~/analytics";
import { MY_WALLET_HELP_TRACKING_PAGE_NAME } from "../../constants";

export function useMyWalletHelpViewModel() {
  const chatbotSupportFeature = useFeature("llmChatbotSupport");
  const isChatbotEnabled = chatbotSupportFeature?.enabled ?? false;

  const localizedFaqUrl = useLocalizedUrl(urls.faq);
  const localizedChatbotUrl = useLocalizedUrl(urls.chatbot);
  const localizedAcademyUrl = useLocalizedUrl(urls.resources.ledgerAcademy);

  const exportLogs = useExportLogs();
  const cleanCache = useCleanCache();
  const dispatch = useDispatch();

  const [isClearCacheDrawerOpen, setIsClearCacheDrawerOpen] = useState(false);

  const onLedgerSupportPress = useCallback(() => {
    track("button_clicked", { button: "LedgerSupport", page: MY_WALLET_HELP_TRACKING_PAGE_NAME });
    Linking.openURL(isChatbotEnabled ? localizedChatbotUrl : localizedFaqUrl);
  }, [isChatbotEnabled, localizedChatbotUrl, localizedFaqUrl]);

  const onLedgerAcademyPress = useCallback(() => {
    track("button_clicked", { button: "LedgerAcademy", page: MY_WALLET_HELP_TRACKING_PAGE_NAME });
    Linking.openURL(localizedAcademyUrl);
  }, [localizedAcademyUrl]);

  const onSaveLogsPress = useCallback(() => {
    track("button_clicked", { button: "SaveLogs", page: MY_WALLET_HELP_TRACKING_PAGE_NAME });
    exportLogs();
  }, [exportLogs]);

  const onLedgerStatusPress = useCallback(() => {
    track("button_clicked", { button: "LedgerStatus", page: MY_WALLET_HELP_TRACKING_PAGE_NAME });
    Linking.openURL(urls.resources.status);
  }, []);

  const onClearCachePress = useCallback(() => {
    track("button_clicked", { button: "ClearCache", page: MY_WALLET_HELP_TRACKING_PAGE_NAME });
    setIsClearCacheDrawerOpen(true);
  }, []);

  const onClearCacheConfirm = useCallback(async () => {
    await cleanCache();
    dispatch(reboot());
  }, [cleanCache, dispatch]);

  const onClearCacheDrawerClose = useCallback(() => {
    setIsClearCacheDrawerOpen(false);
  }, []);

  return {
    isChatbotEnabled,
    onLedgerSupportPress,
    onLedgerAcademyPress,
    onSaveLogsPress,
    onLedgerStatusPress,
    onClearCachePress,
    onClearCacheConfirm,
    isClearCacheDrawerOpen,
    onClearCacheDrawerClose,
  };
}
