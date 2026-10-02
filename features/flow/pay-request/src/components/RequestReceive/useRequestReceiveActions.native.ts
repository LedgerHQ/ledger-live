import { useMemo } from "react";
import { Check, Copy, Download, Share, ShieldCheck } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import type { RequestReceiveActionId } from "../../types";

type SymbolComponent = typeof Copy;

export type RequestReceiveActionTile = Readonly<{
  id: RequestReceiveActionId;
  icon: SymbolComponent;
  label: string;
  onClick: () => void;
  testId: string;
}>;

type UseRequestReceiveActionsParams = Readonly<{
  visibleActions: readonly RequestReceiveActionId[];
  hasCopied: boolean;
  onShare: () => void;
  onCopy: () => void;
  onSave: () => void;
  onVerify: () => void;
}>;

export function useRequestReceiveActions({
  visibleActions,
  hasCopied,
  onShare,
  onCopy,
  onSave,
  onVerify,
}: UseRequestReceiveActionsParams): readonly RequestReceiveActionTile[] {
  const { t } = useTranslation();

  return useMemo(() => {
    const byId: Readonly<Record<RequestReceiveActionId, RequestReceiveActionTile>> = {
      share: {
        id: "share",
        icon: Share,
        label: t("payTab.request.actions.share"),
        onClick: onShare,
        testId: "pay-request-receive-share",
      },
      copy: {
        id: "copy",
        icon: hasCopied ? Check : Copy,
        label: hasCopied ? t("payTab.request.actions.copied") : t("payTab.request.actions.copy"),
        onClick: onCopy,
        testId: "pay-request-receive-copy",
      },
      save: {
        id: "save",
        icon: Download,
        label: t("payTab.request.actions.save"),
        onClick: onSave,
        testId: "pay-request-receive-save",
      },
      verify: {
        id: "verify",
        icon: ShieldCheck,
        label: t("payTab.request.actions.verify"),
        onClick: onVerify,
        testId: "pay-request-receive-verify",
      },
    };

    return visibleActions.map(id => byId[id]);
  }, [t, visibleActions, hasCopied, onShare, onCopy, onSave, onVerify]);
}
