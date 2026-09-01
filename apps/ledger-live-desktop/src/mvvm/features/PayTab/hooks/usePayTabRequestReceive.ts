import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AssetCategory } from "@domain/api-aggregated-assets";
import type { PayRequestTrackEvent, RequestReceiveProps } from "@features/flow-pay-request";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard";
import { useOpenAssetAndAccount } from "../../ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { deriveRequestReceiveData } from "./deriveRequestReceiveData";
import { useSaveRequestReceive } from "./useSaveRequestReceive";
import type { PayVerifySelection } from "./usePayTabVerifyAddress";

const REQUEST_PAGE = "Pay";

// Card top-ups only support stablecoins; filter MAD server-side by category so the
// user can still pick any supported network without exploding the request URL.
const REQUEST_CATEGORIES = [AssetCategory.Stablecoins] as const;

type Selection = Readonly<{ account: AccountLike; parentAccount?: Account }>;

export type UsePayTabRequestReceive = Readonly<{
  open: () => void;
  requestReceive: RequestReceiveProps;
}>;

export function usePayTabRequestReceive(
  onTrackEvent: PayRequestTrackEvent | undefined,
  onVerify: (selection: PayVerifySelection, onDone: () => void) => void,
): UsePayTabRequestReceive {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const copyToClipboard = useCopyToClipboard();
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  const open = useCallback(() => {
    openAssetAndAccount({
      categories: REQUEST_CATEGORIES,
      onSuccess: (account, parentAccount) => {
        setSelection({ account, parentAccount });
        setIsOpen(true);
      },
    });
  }, [openAssetAndAccount]);

  const onClose = useCallback(() => setIsOpen(false), []);

  const reopen = useCallback(() => setIsOpen(true), []);

  const onCopy = useCallback((address: string) => copyToClipboard(address), [copyToClipboard]);

  const handleVerify = useCallback(() => {
    if (!selection) return;
    onClose();
    onVerify(selection, reopen);
  }, [onVerify, onClose, reopen, selection]);

  const data = useMemo(
    () => (selection ? deriveRequestReceiveData(selection.account, selection.parentAccount) : null),
    [selection],
  );

  const saveCard = useSaveRequestReceive(data?.asset.ticker ?? "");

  const labels = useMemo(
    () => ({
      title: t("payTab.request.title", { asset: data?.asset.name ?? "" }),
      networkLabel: t("payTab.request.networkLabel", { network: data?.network ?? "" }),
      actions: {
        share: t("payTab.request.actions.share"),
        copy: t("payTab.request.actions.copy"),
        copied: t("payTab.request.actions.copied"),
        save: t("payTab.request.actions.save"),
        verify: t("payTab.request.actions.verify"),
      },
    }),
    [t, data],
  );

  const requestReceive = useMemo<RequestReceiveProps>(
    () => ({
      isOpen,
      address: data?.address ?? "",
      asset: data?.asset ?? { name: "", ticker: "" },
      network: data?.network ?? "",
      page: REQUEST_PAGE,
      labels,
      assetIcon: data?.assetIcon ?? { ledgerId: "", ticker: "" },
      networkIcon: data?.networkIcon,
      visibleActions: ["save", "copy", "verify"],
      onCopy,
      onSave: saveCard,
      onVerify: handleVerify,
      onClose,
      onTrackEvent,
    }),
    [isOpen, data, labels, onCopy, saveCard, handleVerify, onClose, onTrackEvent],
  );

  return { open, requestReceive };
}
