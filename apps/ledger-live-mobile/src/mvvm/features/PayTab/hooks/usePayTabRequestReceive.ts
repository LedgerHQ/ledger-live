import { useCallback, useMemo, useState } from "react";
import { Share } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AssetCategory } from "@domain/api-aggregated-assets";
import type { PayCardTrackEvent, RequestReceiveProps } from "@features/flow-pay-card-request";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { deriveRequestReceiveData } from "./deriveRequestReceiveData";

const REQUEST_PAGE = "Pay";
const REQUEST_CATEGORIES: AssetCategory[] = [AssetCategory.Stablecoins];

const EMPTY_LABELS: RequestReceiveProps["labels"] = {
  title: "",
  networkLabel: "",
  actions: { share: "", copy: "", copied: "", save: "", verify: "" },
};

type Selection = Readonly<{ account: AccountLike; parentAccount?: Account }>;

export type UsePayTabRequestReceive = Readonly<{
  open: () => void;
  requestReceive: RequestReceiveProps;
}>;

export function usePayTabRequestReceive(
  onTrackEvent: PayCardTrackEvent | undefined,
): UsePayTabRequestReceive {
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const { openDrawer } = useModularDrawerController();

  const open = useCallback(() => {
    openDrawer({
      categories: REQUEST_CATEGORIES,
      flow: "request",
      source: REQUEST_PAGE,
      enableAccountSelection: true,
      onAccountSelected: (account, parentAccount) => {
        setSelection({ account, parentAccount });
        setIsOpen(true);
      },
    });
  }, [openDrawer]);

  const onClose = useCallback(() => setIsOpen(false), []);

  const onCopy = useCallback((address: string) => {
    Clipboard.setString(address);
  }, []);

  const onShare = useCallback((address: string) => {
    void Share.share({ message: address }).catch(() => undefined);
  }, []);

  const data = useMemo(
    () => (selection ? deriveRequestReceiveData(selection.account, selection.parentAccount) : null),
    [selection],
  );

  const requestReceive = useMemo<RequestReceiveProps>(
    () => ({
      isOpen,
      address: data?.address ?? "",
      asset: data?.asset ?? { name: "", ticker: "" },
      network: data?.network ?? "",
      page: REQUEST_PAGE,
      labels: EMPTY_LABELS,
      assetIcon: data?.assetIcon ?? { ledgerId: "", ticker: "" },
      networkIcon: data?.networkIcon,
      visibleActions: ["share", "copy"],
      onShare,
      onCopy,
      onVerify: () => {},
      onClose,
      onTrackEvent,
    }),
    [isOpen, data, onShare, onCopy, onClose, onTrackEvent],
  );

  return { open, requestReceive };
}
