import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Devices } from "@ledgerhq/lumen-ui-react/symbols";
import { getMockServerTransportUrl } from "@ledgerhq/live-dmk-desktop";
import { getMockServerFrontendUrl } from "@ledgerhq/live-dmk-shared";
import { openURL } from "~/renderer/linking";
import { useMockServerStatus } from "./useMockServerStatus";
import { useCopyToClipboard } from "LLD/hooks/useCopyToClipboard";

/**
 * Drives the developer top bar indicator for the Device Management Kit mock
 * server transport. The button is only visible while the transport is enabled
 * (env `MOCK_SERVER_TRANSPORT`), and is colored green when the mock server is
 * reachable, red otherwise. Clicking it copies the current mock server session
 * token to the clipboard; right-clicking opens the mock server configuration UI
 * on that session.
 */
export const useMockServerTransport = () => {
  const { t } = useTranslation();
  const { enabled, connected, sessionToken } = useMockServerStatus();
  const copyToClipboard = useCopyToClipboard();

  const handleMockServer = useCallback(() => {
    if (sessionToken) copyToClipboard(sessionToken);
  }, [copyToClipboard, sessionToken]);

  // No event name: `openURL` reports the URL it opened, and this one carries the
  // session token.
  const handleOpenConfigurationUi = useCallback(() => {
    if (sessionToken)
      openURL(getMockServerFrontendUrl(getMockServerTransportUrl(), sessionToken), "");
  }, [sessionToken]);

  return {
    isVisible: enabled,
    handleMockServer,
    handleOpenConfigurationUi,
    icon: Devices,
    tooltip: connected
      ? t("settings.developer.mockServerStatus.connected")
      : t("settings.developer.mockServerStatus.disconnected"),
    // Solid green / red circle, matching the experimental & feature-flag buttons.
    className: connected
      ? "bg-success-strong hover:bg-success-strong active:bg-success-strong"
      : "bg-error-strong hover:bg-error-strong active:bg-error-strong",
  };
};
