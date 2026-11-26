import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { HelpPage, type DesktopHelpPort, type HelpSlots } from "@features/flow-settings-help";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { Button } from "@ledgerhq/lumen-ui-react";
import { track } from "@shared/analytics";
import { files } from "~/renderer/bridge";
import ExportLogsBtn from "~/renderer/components/ExportLogsButton";
import { urls } from "~/config/urls";
import logger from "~/renderer/logger";
import ResetFallbackModal from "~/renderer/modals/ResetFallbackModal";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { useHardReset, useSoftReset } from "~/renderer/reset";
import RepairDeviceButton from "~/renderer/screens/settings/sections/Help/RepairDeviceButton";

function SaveLogsAction() {
  const { t } = useTranslation();
  return (
    <ExportLogsBtn
      renderCustomComponent={onSave => (
        <Button
          appearance="gray"
          size="sm"
          onClick={() => {
            void track("ExportLogs");
            void onSave();
          }}
        >
          {t("settings.exportLogs.btn")}
        </Button>
      )}
    />
  );
}
function RepairDeviceAction() {
  const { t } = useTranslation();
  return (
    <RepairDeviceButton
      renderCustomComponent={onOpen => (
        <Button appearance="gray" size="sm" onClick={onOpen}>
          {t("settings.repairDevice.button")}
        </Button>
      )}
    />
  );
}

/**
 * The port of the Help page on desktop: the links and actions of the legacy Help. A failed clear
 * or reset opens the legacy fallback, and the port resolves so the page leaves its pending state.
 */
function useDesktopHelpPort() {
  const navigate = useNavigate();
  const softReset = useSoftReset();
  const hardReset = useHardReset();
  const { shouldUseLazyOnboarding } = useWalletFeaturesConfig("desktop");
  const [fallbackOpened, setFallbackOpened] = useState(false);
  const closeFallback = useCallback(() => setFallbackOpened(false), []);

  const lldChatbotSupport = useFeature("lldChatbotSupport")?.enabled ?? false;
  const llmChatbotSupport = useFeature("llmChatbotSupport")?.enabled ?? false;
  const supportUrl = useLocalizedUrl(
    lldChatbotSupport || llmChatbotSupport ? urls.chatbot : urls.faq,
  );
  const academyUrl = useLocalizedUrl(urls.helpModal.ledgerAcademy);
  const statusUrl = useLocalizedUrl(urls.helpModal.status);

  const clearCache = useCallback(async () => {
    try {
      await softReset();
    } catch (error) {
      logger.error(error);
      setFallbackOpened(true);
    }
  }, [softReset]);

  const resetApp = useCallback(async () => {
    try {
      await hardReset();
    } catch (error) {
      logger.error(error);
      setFallbackOpened(true);
    }
  }, [hardReset]);

  const port = useMemo<DesktopHelpPort>(
    () => ({
      platform: "desktop",
      links: { support: supportUrl, academy: academyUrl, status: statusUrl },
      clearCache,
      resetApp,
      viewUserData: () => {
        files.openUserDataDirectory().catch(error => logger.error(error));
      },
      launchOnboarding: () => {
        navigate(shouldUseLazyOnboarding ? "/onboarding/select-device" : "/onboarding");
      },
    }),
    [supportUrl, academyUrl, statusUrl, clearCache, resetApp, navigate, shouldUseLazyOnboarding],
  );

  return { port, fallbackOpened, closeFallback };
}

/** The Help page of Ledger Wallet desktop, shown behind the newSettings flag. */
export function DesktopHelpPage() {
  const { port, fallbackOpened, closeFallback } = useDesktopHelpPort();
  const slots: HelpSlots = {
    saveLogs: <SaveLogsAction />,
    repairDevice: <RepairDeviceAction />,
  };

  return (
    <>
      <HelpPage
        port={port}
        slots={slots}
        whileConfirming={<SyncSkipUnderPriority priority={999} />}
        testID="settings-help"
      />
      <ResetFallbackModal isOpened={fallbackOpened} onClose={closeFallback} />
    </>
  );
}
