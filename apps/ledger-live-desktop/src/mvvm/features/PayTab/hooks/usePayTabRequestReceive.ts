import { useCallback, useMemo, useState } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AssetCategory } from "@domain/api-aggregated-assets";
import type { PayRequestTrackEvent, RequestReceiveProps } from "@features/flow-pay-request";
import {
  markReceiveVerifyHintSeen,
  selectHasSeenReceiveVerifyHint,
} from "@features/flow-pay-request/state";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setFlowValue, setSourceValue } from "~/renderer/reducers/modularDialog";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard";
import { useOpenAssetAndAccount } from "../../ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { deriveRequestReceiveData } from "./deriveRequestReceiveData";
import { useSaveRequestReceive } from "./useSaveRequestReceive";
import type { PayVerifySelection } from "./usePayTabVerifyAddress";

const REQUEST_PAGE = "Request complete";
const VERIFY_HINT = "verify";

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
  const dispatch = useDispatch();
  const hasSeenReceiveVerifyHint = useSelector(selectHasSeenReceiveVerifyHint);
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const copyToClipboard = useCopyToClipboard();
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  const open = useCallback(() => {
    dispatch(setFlowValue("request"));
    dispatch(setSourceValue("pay"));
    openAssetAndAccount({
      categories: REQUEST_CATEGORIES,
      onSuccess: (account, parentAccount) => {
        setSelection({ account, parentAccount });
        setIsOpen(true);
      },
    });
  }, [dispatch, openAssetAndAccount]);

  const onClose = useCallback(() => setIsOpen(false), []);

  const reopen = useCallback(() => setIsOpen(true), []);

  const onCopy = useCallback((address: string) => copyToClipboard(address), [copyToClipboard]);

  const markHintSeen = useCallback(() => {
    dispatch(markReceiveVerifyHintSeen());
  }, [dispatch]);

  const onHintShown = useCallback(() => {
    onTrackEvent?.("hint_impression", {
      hint: VERIFY_HINT,
      buttonLocation: "request",
      page: REQUEST_PAGE,
      flow: "request",
    });
  }, [onTrackEvent]);

  const onGotIt = useCallback(() => {
    onTrackEvent?.("button_clicked", {
      button: "got it",
      hint: VERIFY_HINT,
      buttonLocation: "request",
      page: REQUEST_PAGE,
      flow: "request",
    });
    markHintSeen();
  }, [markHintSeen, onTrackEvent]);

  const handleVerify = useCallback(() => {
    if (!selection) return;
    markHintSeen();
    onClose();
    onVerify(selection, reopen);
  }, [markHintSeen, onClose, onVerify, reopen, selection]);

  const data = useMemo(
    () => (selection ? deriveRequestReceiveData(selection.account, selection.parentAccount) : null),
    [selection],
  );

  const saveCard = useSaveRequestReceive(data?.asset.ticker ?? "");

  const requestReceive = useMemo<RequestReceiveProps>(
    () => ({
      isOpen,
      address: data?.address ?? "",
      asset: data?.asset ?? { name: "", ticker: "" },
      network: data?.network ?? "",
      page: REQUEST_PAGE,
      assetIcon: data?.assetIcon ?? { ledgerId: "", ticker: "" },
      networkIcon: data?.networkIcon,
      visibleActions: ["save", "copy", "verify"],
      onCopy,
      onSave: saveCard,
      onVerify: handleVerify,
      onClose,
      onTrackEvent,
      verifyHint: hasSeenReceiveVerifyHint
        ? undefined
        : {
            open: true,
            onGotIt,
            onShown: onHintShown,
          },
    }),
    [
      isOpen,
      data,
      onCopy,
      saveCard,
      handleVerify,
      onClose,
      onTrackEvent,
      hasSeenReceiveVerifyHint,
      onGotIt,
      onHintShown,
    ],
  );

  return { open, requestReceive };
}
