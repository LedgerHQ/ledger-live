import { useCallback, useMemo, useState } from "react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AssetCategory } from "@domain/api-aggregated-assets";
import type { RequestReceiveProps } from "@features/flow-pay-request";
import { trackButtonClicked, trackEvent } from "@features/platform-pay-analytics";
import {
  markReceiveVerifyHintSeen,
  selectHasSeenReceiveVerifyHint,
} from "@features/flow-pay-request/state";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setFlowValue, setSourceValue } from "~/renderer/reducers/modularDialog";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard";
import { useOpenAssetAndAccount } from "../../ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { useResumeAddAccountAfterOnboarding } from "../../AddAccountDrawer/hooks/useResumeAddAccountAfterOnboarding";
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
  onVerify: (selection: PayVerifySelection, onDone: () => void) => void,
): UsePayTabRequestReceive {
  const dispatch = useDispatch();
  const hasSeenReceiveVerifyHint = useSelector(selectHasSeenReceiveVerifyHint);
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const copyToClipboard = useCopyToClipboard();
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  const openRequest = useCallback(
    (currency?: CryptoOrTokenCurrency) => {
      dispatch(setFlowValue("request"));
      dispatch(setSourceValue("pay"));
      openAssetAndAccount({
        categories: REQUEST_CATEGORIES,
        currencies: currency && [currency.id],
        areCurrenciesFiltered: currency !== undefined,
        onSuccess: (account, parentAccount) => {
          setSelection({ account, parentAccount });
          setIsOpen(true);
        },
      });
    },
    [dispatch, openAssetAndAccount],
  );
  const open = useCallback(() => openRequest(), [openRequest]);

  // Back from device onboarding: reopen the request on the asset the user had picked.
  useResumeAddAccountAfterOnboarding(openRequest);

  const onClose = useCallback(() => setIsOpen(false), []);

  const reopen = useCallback(() => setIsOpen(true), []);

  const onCopy = useCallback((address: string) => copyToClipboard(address), [copyToClipboard]);

  const markHintSeen = useCallback(() => {
    dispatch(markReceiveVerifyHintSeen());
  }, [dispatch]);

  const onHintShown = useCallback(() => {
    trackEvent("hint_impression", {
      hint: VERIFY_HINT,
      buttonLocation: "request",
      page: REQUEST_PAGE,
      flow: "request",
    });
  }, []);

  const onGotIt = useCallback(() => {
    trackButtonClicked({
      button: "got it",
      hint: VERIFY_HINT,
      buttonLocation: "request",
      page: REQUEST_PAGE,
      flow: "request",
    });
    markHintSeen();
  }, [markHintSeen]);

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
      hasSeenReceiveVerifyHint,
      onGotIt,
      onHintShown,
    ],
  );

  return { open, requestReceive };
}
