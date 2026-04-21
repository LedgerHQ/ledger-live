import { useCallback, useState } from "react";
import { Linking } from "react-native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useCleanCache } from "~/actions/general";
import { reboot } from "~/actions/appstate";
import { useDispatch } from "~/context/hooks";
import useExportLogs from "~/components/useExportLogs";
import { urls } from "~/utils/urls";
import { track } from "~/analytics";
import { ScreenName } from "~/const";

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
    track("button_clicked", { button: "LedgerSupport", page: ScreenName.MyWalletHelp });
    Linking.openURL(isChatbotEnabled ? localizedChatbotUrl : localizedFaqUrl);
  }, [isChatbotEnabled, localizedChatbotUrl, localizedFaqUrl]);

  const onLedgerAcademyPress = useCallback(() => {
    track("button_clicked", { button: "LedgerAcademy", page: ScreenName.MyWalletHelp });
    Linking.openURL(localizedAcademyUrl);
  }, [localizedAcademyUrl]);

  const onSaveLogsPress = useCallback(() => {
    track("button_clicked", { button: "SaveLogs", page: ScreenName.MyWalletHelp });
    exportLogs();
  }, [exportLogs]);

  const onLedgerStatusPress = useCallback(() => {
    track("button_clicked", { button: "LedgerStatus", page: ScreenName.MyWalletHelp });
    Linking.openURL(urls.resources.status);
  }, []);

  const onClearCachePress = useCallback(() => {
    track("button_clicked", { button: "ClearCache", page: ScreenName.MyWalletHelp });
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
