import { useState } from "react";
import { Linking } from "react-native";
import { useTranslation } from "@shared/i18n";
import type { ReconnectSheetProps } from "./ReconnectSheet.types";
import type { SessionReconnectState } from "./useSessionReconnect";
import { reconnectUrls } from "./urls";

export type ReconnectSheetViewProps = Readonly<{
  state: SessionReconnectState;
  isOpen: boolean;
  title: string;
  description: string;
  retryLabel: string;
  helpLabel: string;
  onRetry: () => void;
  onGetHelp: () => void;
  onClose: () => void;
}>;

export function useReconnectSheetViewModel({
  connection,
  productName,
  suspendSheets,
}: ReconnectSheetProps): ReconnectSheetViewProps | null {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState<SessionReconnectState | null>(null);
  const state = connection?.state ?? null;
  if (dismissed !== null && dismissed !== state) setDismissed(null);

  if (!connection) return null;
  const copy =
    connection.state === "reconnecting"
      ? {
          title: t("deviceOnboarding.setup.connection.reconnecting.title", { productName }),
          description: t("deviceOnboarding.setup.connection.reconnecting.description", {
            productName,
          }),
        }
      : {
          title: t("deviceOnboarding.setup.connection.failed.title", { productName }),
          description: t("deviceOnboarding.setup.connection.failed.description", { productName }),
        };

  return {
    state: connection.state,
    isOpen: dismissed !== connection.state && !suspendSheets,
    ...copy,
    retryLabel: t("deviceOnboarding.setup.connection.failed.retryCta"),
    helpLabel: t("deviceOnboarding.setup.connection.failed.helpCta"),
    onRetry: connection.retry,
    onGetHelp: () => void Linking.openURL(reconnectUrls.help),
    onClose: () => setDismissed(connection.state),
  };
}
