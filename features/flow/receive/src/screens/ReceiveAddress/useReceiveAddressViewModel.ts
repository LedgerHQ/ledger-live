import { useCallback, useMemo } from "react";
import type { UseVerifyAddressExecutorViewModelParams } from "../../hooks/useVerifyAddressExecutorViewModel";
import { canVerifyOnDevice } from "../../logic/canVerifyOnDevice";
import { splitAddress } from "../../logic/splitAddress";
import { RECEIVE_URLS } from "../../urls";
import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";
import { toReceiveAddressTracking, trackReceiveAddressButton } from "./receiveAddressTracking";
import { useAddressSanctionCheck } from "./useAddressSanctionCheck";
import { useReceiveAddressActions } from "./useReceiveAddressActions";
import { useReceiveAddressHeader } from "./useReceiveAddressHeader";
import { useReceiveAddressHelp } from "./useReceiveAddressHelp";
import { useReceiveAddressMemo } from "./useReceiveAddressMemo";
import { useReceiveAddressNotices } from "./useReceiveAddressNotices";
import { useReceiveAddressPageEvent } from "./useReceiveAddressPageEvent";
import { useReceiveAddressPanel } from "./useReceiveAddressPanel";
import { useReceiveAddressSelection } from "./useReceiveAddressSelection";
import { useReceiveFamilyConfig } from "./useReceiveFamilyConfig";
import { useReceiveScreenData } from "./useReceiveScreenData";

export type ReceiveAddressViewModel = ReceiveAddressViewProps &
  Readonly<{
    /** The device verification to mount, while one runs. */
    verification: UseVerifyAddressExecutorViewModelParams | undefined;
  }>;

export function useReceiveAddressViewModel({
  accountUUID,
  assetId,
  onClose,
  onCopyAddress,
  onShareAddress,
  VerifyAddressExecutor,
  getFamilyConfig,
  serviceIncidents,
  onOpenUrl,
  checkAddressSanctioned,
  onUseLegacyFlow,
  source,
}: ReceiveAddressProps): ReceiveAddressViewModel {
  const tracking = useMemo(() => toReceiveAddressTracking(source), [source]);
  const { descriptor, data, accountStatus } = useReceiveScreenData(accountUUID, assetId);
  const header = useReceiveAddressHeader(descriptor, assetId);
  const receive = data.type === "ready" ? data.receive : undefined;
  const selection = useReceiveAddressSelection(receive, tracking);
  const familyConfig = useReceiveFamilyConfig({
    getFamilyConfig,
    descriptor,
    asset: header.asset,
    receive,
    accountStatus,
  });
  const { copy } = header;
  const { selected: picked } = selection;
  const sanctionStatus = useAddressSanctionCheck(picked?.address, checkAddressSanctioned);
  // A listed address is never shown, copied or verified.
  const selected = sanctionStatus === "clear" ? picked : undefined;
  const closeFlow = useCallback(() => {
    trackReceiveAddressButton("close", tracking);
    onClose();
  }, [tracking, onClose]);
  const { actions, verification, isVerified } = useReceiveAddressActions({
    accountUUID,
    assetId,
    selected,
    familyConfig,
    copy,
    hasVerifyExecutor: !!VerifyAddressExecutor,
    tracking,
    onCopyAddress,
    onShareAddress,
    onClose,
  });

  const { panel, openPanel, closePanel: closeOpenPanel } = useReceiveAddressPanel();
  const closePanel = useCallback(() => {
    trackReceiveAddressButton("close", tracking);
    closeOpenPanel();
  }, [tracking, closeOpenPanel]);
  const { notices, serviceWarning } = useReceiveAddressNotices({
    familyConfig,
    selected,
    serviceIncidents,
    copy,
    onOpenUrl,
    openServiceStatus: () => openPanel("serviceStatus"),
    tracking,
  });

  const { memoCard, memoPanel } = useReceiveAddressMemo({
    selected,
    isOpen: panel === "memo",
    copy,
    onOpenUrl,
    open: () => openPanel("memo"),
    close: closePanel,
    tracking,
  });

  const { helpCard, helpPanel } = useReceiveAddressHelp({
    isOpen: panel === "help",
    copy,
    onOpenUrl,
    open: () => openPanel("help"),
    close: closePanel,
    tracking,
  });

  useReceiveAddressPageEvent({
    shownKey: selected?.address ?? (data.type === "activationRequired" ? data.method : undefined),
    assetId,
    descriptor,
    isVerified,
    isVerifyPopoverDisplayed: !!actions.verifyHint,
    canVerifyOnDevice: canVerifyOnDevice(selected?.verification),
    isTokenAssociationRequired: data.type === "activationRequired" && data.method === "association",
    tracking,
  });

  const address = useMemo(
    () =>
      selected && header.data
        ? {
            value: selected.address,
            parts: splitAddress(selected.address),
            label: selection.options.length > 1 ? copy.addressOptionLabels[selected.id] : undefined,
            assetIcon: header.data.assetIcon,
          }
        : undefined,
    [selected, header.data, selection.options.length, copy.addressOptionLabels],
  );

  const continueAction = onUseLegacyFlow && {
    label: copy.continueLabel,
    onPress: () => {
      trackReceiveAddressButton("continue in legacy flow", tracking);
      onUseLegacyFlow();
    },
  };
  const blocked =
    data.type === "onboardingRequired"
      ? { title: copy.onboardingTitle, description: copy.onboardingDescription, continueAction }
      : data.type === "activationRequired"
        ? {
            title: copy.activationTitle,
            description: copy.activationDescriptions[data.method],
            continueAction,
          }
        : undefined;

  return {
    blocked,
    isLoading: data.type === "loading" || (!!picked && sanctionStatus === "checking"),
    sanctioned:
      picked && sanctionStatus === "sanctioned"
        ? {
            title: copy.sanctionedTitle,
            description: copy.sanctionedDescription(picked.address),
            closeLabel: copy.closeLabel,
            onClose: closeFlow,
            learnMore: onOpenUrl
              ? {
                  label: copy.learnMoreLabel,
                  onPress: () => onOpenUrl(RECEIVE_URLS.sanctionedAddress),
                }
              : undefined,
          }
        : undefined,
    error:
      data.type === "error"
        ? {
            title: copy.errorTitle,
            description: copy.errorDescription,
            retryLabel: copy.retryLabel,
            onRetry: data.retry,
          }
        : undefined,
    addressSelection: selection.isSelecting
      ? {
          title: copy.selectAddressTitle,
          options: selection.options.map(({ id }) => ({ id, label: copy.addressOptionLabels[id] })),
          onSelect: selection.select,
        }
      : undefined,
    address,
    actions,
    notices,
    serviceWarning,
    serviceStatus:
      panel === "serviceStatus" && serviceIncidents
        ? {
            title: copy.serviceStatusTitle,
            incidents: serviceIncidents,
            gotItLabel: copy.gotItLabel,
            onClose: closePanel,
          }
        : undefined,
    memoCard,
    memoPanel,
    helpCard,
    helpPanel,
    verification,
    title: header.title,
    networkLabel: header.networkLabel,
    networkIcon: header.data?.networkIcon,
    onBack: selection.backToSelection,
    onClose: closeFlow,
  };
}
