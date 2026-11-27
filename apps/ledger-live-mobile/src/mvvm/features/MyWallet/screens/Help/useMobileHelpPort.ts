import { useCallback, useMemo } from "react";
import type { MobileHelpPort } from "@features/flow-settings-help";
import { useFeature } from "@features/platform-feature-flags";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useCleanCache } from "~/actions/general";
import { reboot } from "~/actions/appstate";
import { useDispatch } from "~/context/hooks";
import useExportLogs from "~/components/useExportLogs";
import { urls } from "~/utils/urls";

export function useMobileHelpPort(): MobileHelpPort {
  const supportOpensChatbot = useFeature("llmChatbotSupport")?.enabled ?? false;
  const faqUrl = useLocalizedUrl(urls.faq);
  const chatbotUrl = useLocalizedUrl(urls.chatbot);
  const academyUrl = useLocalizedUrl(urls.resources.ledgerAcademy);

  const saveLogs = useExportLogs();
  const cleanCache = useCleanCache();
  const dispatch = useDispatch();

  const clearCache = useCallback(async () => {
    await cleanCache();
    dispatch(reboot());
  }, [cleanCache, dispatch]);

  return useMemo(
    () => ({
      platform: "mobile",
      links: {
        support: supportOpensChatbot ? chatbotUrl : faqUrl,
        academy: academyUrl,
        status: urls.resources.status,
      },
      supportOpensChatbot,
      clearCache,
      saveLogs,
    }),
    [supportOpensChatbot, chatbotUrl, faqUrl, academyUrl, clearCache, saveLogs],
  );
}
