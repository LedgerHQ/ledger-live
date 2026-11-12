import { useMemo } from "react";
import { Check, Copy, Share, ShieldCheck } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import type { ReceiveAddressActionId } from "../../../types";

type SymbolComponent = typeof Copy;

export type ReceiveAddressActionTile = Readonly<{
  id: ReceiveAddressActionId;
  icon: SymbolComponent;
  label: string;
  onClick: () => void;
  testId: string;
  disabled: boolean;
}>;

type UseAddressActionsParams = Readonly<{
  visibleActions: readonly ReceiveAddressActionId[];
  hasCopied: boolean;
  onShare: () => void;
  onCopy: () => void;
  onVerify: () => void;
  isVerifyDisabled: boolean;
}>;

export function useAddressActions({
  visibleActions,
  hasCopied,
  onShare,
  onCopy,
  onVerify,
  isVerifyDisabled,
}: UseAddressActionsParams): readonly ReceiveAddressActionTile[] {
  const { t } = useTranslation();

  return useMemo(() => {
    const byId: Readonly<Record<ReceiveAddressActionId, ReceiveAddressActionTile>> = {
      share: {
        id: "share",
        icon: Share,
        label: t("receiveAddress.actions.share"),
        onClick: onShare,
        testId: "receive-address-share",
        disabled: false,
      },
      copy: {
        id: "copy",
        icon: hasCopied ? Check : Copy,
        label: hasCopied ? t("receiveAddress.actions.copied") : t("receiveAddress.actions.copy"),
        onClick: onCopy,
        testId: "receive-address-copy",
        disabled: false,
      },
      verify: {
        id: "verify",
        icon: ShieldCheck,
        label: t("receiveAddress.actions.verify"),
        onClick: onVerify,
        testId: "receive-address-verify",
        disabled: isVerifyDisabled,
      },
    };

    return visibleActions.map(id => byId[id]);
  }, [t, visibleActions, hasCopied, onShare, onCopy, onVerify, isVerifyDisabled]);
}
