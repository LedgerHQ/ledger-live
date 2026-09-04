import { useMemo } from "react";
import { Check, Copy, Download, LedgerLogo, Share } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { RequestReceiveActionId, RequestReceiveActionLabels } from "../../types";

type SymbolComponent = typeof Copy;

export type RequestReceiveActionTile = Readonly<{
  id: RequestReceiveActionId;
  icon: SymbolComponent;
  label: string;
  onClick: () => void;
  testId: string;
}>;

type UseRequestReceiveActionsParams = Readonly<{
  labels: RequestReceiveActionLabels;
  visibleActions: readonly RequestReceiveActionId[];
  hasCopied: boolean;
  onShare: () => void;
  onCopy: () => void;
  onSave: () => void;
  onVerify: () => void;
}>;

export function useRequestReceiveActions({
  labels,
  visibleActions,
  hasCopied,
  onShare,
  onCopy,
  onSave,
  onVerify,
}: UseRequestReceiveActionsParams): readonly RequestReceiveActionTile[] {
  return useMemo(() => {
    const byId: Readonly<Record<RequestReceiveActionId, RequestReceiveActionTile>> = {
      share: {
        id: "share",
        icon: Share,
        label: labels.share,
        onClick: onShare,
        testId: "pay-request-receive-share",
      },
      copy: {
        id: "copy",
        icon: hasCopied ? Check : Copy,
        label: hasCopied ? labels.copied : labels.copy,
        onClick: onCopy,
        testId: "pay-request-receive-copy",
      },
      save: {
        id: "save",
        icon: Download,
        label: labels.save,
        onClick: onSave,
        testId: "pay-request-receive-save",
      },
      verify: {
        id: "verify",
        icon: LedgerLogo,
        label: labels.verify,
        onClick: onVerify,
        testId: "pay-request-receive-verify",
      },
    };

    return visibleActions.map(id => byId[id]);
  }, [labels, visibleActions, hasCopied, onShare, onCopy, onSave, onVerify]);
}
