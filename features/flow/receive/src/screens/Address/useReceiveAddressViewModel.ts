import { useCallback, useMemo, useState } from "react";
import { track } from "@shared/analytics";
import { useReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { splitAddress } from "../../utils/splitAddress";
import type {
  ReceiveAddressActionId,
  ReceiveAddressOptionId,
  ReceiveAddressPanel,
  ReceiveAddressProps,
  ReceiveAddressViewProps,
  ReceiveHelpArticleId,
} from "../../types";

const FLOW = "receive";

function trackButton(button: string) {
  void track("button_clicked", { button, flow: FLOW, page: "Receive address" });
}

export function useReceiveAddressViewModel({
  address: defaultAddress,
  asset,
  network,
  assetIcon,
  networkIcon,
  family,
  isLoadingAddress = false,
  isCheckingAddress = false,
  blockedReason,
  onRetry,
  onUseLegacyFlow,
  onActivateAsset,
  serviceIncidents,
  visibleActions,
  verifyHint,
  onCopy,
  onShare,
  onVerify,
  onOpenHelpArticle,
  onLearnMoreMemoTag,
  onClose,
}: ReceiveAddressProps): ReceiveAddressViewProps {
  const hasAddressChoice = (family.addressOptions?.length ?? 0) > 1;
  const [openedPanel, setPanel] = useState<ReceiveAddressPanel>(
    hasAddressChoice ? "selectAddress" : "address",
  );
  const [selectedOptionId, setSelectedOptionId] = useState<ReceiveAddressOptionId | undefined>(
    hasAddressChoice ? undefined : family.addressOptions?.[0]?.id,
  );

  // The address options can arrive after mount, with the `receive` data: pick one first.
  const panel: ReceiveAddressPanel =
    hasAddressChoice && !selectedOptionId && openedPanel === "address"
      ? "selectAddress"
      : openedPanel;
  const selectedOption = family.addressOptions?.find(option => option.id === selectedOptionId);
  const address = selectedOption?.address ?? defaultAddress;
  const verification = selectedOption?.verification ?? family.verification;
  const memoType = selectedOption ? selectedOption.memoType : family.memoType;
  const isVerifyDisabled = verification === "unavailable";
  const status = blockedReason
    ? "blocked"
    : isLoadingAddress
      ? "loading"
      : isCheckingAddress
        ? "checking"
        : "ready";

  const copy = useReceiveAddressCopy({
    assetTicker: asset.ticker,
    network,
    family,
    verification,
    memoType,
    blockedReason,
    serviceIncidents,
    canActivateAsset: !!onActivateAsset,
  });

  const handleActivate = useCallback(() => {
    trackButton("activate_asset");
    onActivateAsset?.();
  }, [onActivateAsset]);

  const onBackToAddress = useCallback(() => setPanel("address"), []);
  const onOpenPanel = useCallback((next: "memoTag" | "help") => {
    trackButton(next === "memoTag" ? "need_memo_tag" : "get_help");
    setPanel(next);
  }, []);
  const onSelectAddressOption = useCallback((id: ReceiveAddressOptionId) => {
    trackButton(`address_option_${id}`);
    setSelectedOptionId(id);
    setPanel("address");
  }, []);
  const onBackToAddressSelection = useCallback(() => setPanel("selectAddress"), []);

  const addressParts = useMemo(() => splitAddress(address), [address]);

  const actions = useMemo<readonly ReceiveAddressActionId[]>(
    () => visibleActions.filter(id => id !== "share" || !!onShare),
    [visibleActions, onShare],
  );

  const handleCopy = useCallback(async () => {
    trackButton("copy");
    return onCopy(address);
  }, [onCopy, address]);

  const handleShare = useCallback(() => {
    trackButton("share");
    onShare?.(address);
  }, [onShare, address]);

  const handleVerify = useCallback(() => {
    if (isVerifyDisabled) return;
    trackButton("verify");
    onVerify(address, selectedOptionId);
  }, [isVerifyDisabled, onVerify, address, selectedOptionId]);

  const handleOpenHelpArticle = useCallback(
    (id: ReceiveHelpArticleId) => {
      trackButton(`help_${id}`);
      onOpenHelpArticle(id);
    },
    [onOpenHelpArticle],
  );

  return {
    ...copy,
    blocked: copy.blocked && {
      ...copy.blocked,
      onRetry: copy.blocked.retryLabel ? onRetry : undefined,
      onUseLegacyFlow: copy.blocked.legacyFlowLabel ? onUseLegacyFlow : undefined,
      onActivate: copy.blocked.activateLabel ? handleActivate : undefined,
    },
    assetIcon,
    networkIcon,
    status,
    memoType,
    onSelectAddressOption,
    onBackToAddressSelection: hasAddressChoice ? onBackToAddressSelection : undefined,
    addressParts,
    qrPayload: address,
    visibleActions: actions,
    isVerifyDisabled,
    panel,
    verifyHint:
      isVerifyDisabled || panel !== "address" || status !== "ready" ? undefined : verifyHint,
    onOpenPanel,
    onBackToAddress,
    onCopy: handleCopy,
    onShare: handleShare,
    onVerify: handleVerify,
    onOpenHelpArticle: handleOpenHelpArticle,
    onLearnMoreMemoTag,
    onClose,
  };
}
