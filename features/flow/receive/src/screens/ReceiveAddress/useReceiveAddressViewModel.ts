import { useCallback, useMemo } from "react";
import { useOpenLink, useUrlLocalizer } from "@shared/linking";
import type { UseVerifyAddressExecutorViewModelParams } from "../../hooks/useVerifyAddressExecutorViewModel";
import { splitAddress } from "../../logic/splitAddress";
import { RECEIVE_URLS } from "../../urls";
import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";
import type { ReceiveGateType } from "../../types";
import { useAddressSanctionCheck } from "./useAddressSanctionCheck";
import { useReceiveAddressActions } from "./useReceiveAddressActions";
import { useReceiveAddressGate } from "./useReceiveAddressGate";
import { useReceiveAddressHeader } from "./useReceiveAddressHeader";
import { useReceiveAddressHelp } from "./useReceiveAddressHelp";
import { useReceiveAddressMemo } from "./useReceiveAddressMemo";
import { useReceiveAddressNotices } from "./useReceiveAddressNotices";
import { useReceiveAddressOperation } from "./useReceiveAddressOperation";
import { useReceiveAddressSelection } from "./useReceiveAddressSelection";
import { useReceiveAddressServiceStatus } from "./useReceiveAddressServiceStatus";
import { useReceiveFamilyConfig } from "./useReceiveFamilyConfig";
import { useReceiveScreenData, type ReceiveScreenData } from "./useReceiveScreenData";

export type ReceiveAddressViewModel = ReceiveAddressViewProps &
  Readonly<{
    /** The device verification to mount, while one runs. */
    verification: UseVerifyAddressExecutorViewModelParams | undefined;
  }>;

const GATE_OF_STATE: Partial<Record<ReceiveScreenData["type"], ReceiveGateType>> = {
  onboardingRequired: "onboarding",
  activationRequired: "activation",
};

export function useReceiveAddressViewModel({
  accountUUID,
  assetId,
  source,
  onClose: closeScreen,
  onCopyAddress,
  onShareAddress,
  VerifyAddressExecutor,
  getFamilyConfig,
  serviceIncidents,
  onResolveGate: resolveGate,
  checkAddressSanctioned,
}: ReceiveAddressProps): ReceiveAddressViewModel {
  const { data, accountStatus, refreshGate } = useReceiveScreenData(accountUUID, assetId);
  const header = useReceiveAddressHeader(assetId);
  const receive = data.type === "ready" ? data.receive : undefined;
  const selection = useReceiveAddressSelection(receive);
  const familyConfig = useReceiveFamilyConfig({
    getFamilyConfig,
    asset: header.asset,
    receive,
    accountStatus,
  });
  const { copy } = header;
  const { selected: picked } = selection;
  const sanctionStatus = useAddressSanctionCheck(picked?.address, checkAddressSanctioned);
  // A listed address is never shown, copied or verified.
  const selected = sanctionStatus === "clear" ? picked : undefined;
  const { onClose, onResolveGate, onRetry } = useReceiveAddressOperation({
    assetId,
    source,
    serviceIncidents,
    onClose: closeScreen,
    onResolveGate: resolveGate,
    asset: header.asset,
    network: header.network,
    data,
    selection,
    sanctionStatus,
  });
  const { actions, verification } = useReceiveAddressActions({
    accountUUID,
    assetId,
    selected,
    familyConfig,
    copy,
    hasVerifyExecutor: !!VerifyAddressExecutor,
    onCopyAddress,
    onShareAddress,
  });

  const openLink = useOpenLink();
  const localizeUrl = useUrlLocalizer();
  const openSupportUrl = useCallback(
    (url: string) => openLink(localizeUrl(url)),
    [openLink, localizeUrl],
  );
  const serviceStatus = useReceiveAddressServiceStatus({
    serviceIncidents,
    continueLabel: copy.continueLabel,
    onOpenUrl: openLink,
  });
  const notices = useReceiveAddressNotices({
    familyConfig,
    selected,
    copy,
    onOpenUrl: openSupportUrl,
  });
  const { helpCard, helpPanel } = useReceiveAddressHelp({ copy, onOpenUrl: openSupportUrl });
  const gate = useReceiveAddressGate({
    gateType: GATE_OF_STATE[data.type],
    isVisible: !serviceStatus && !helpPanel,
    copy,
    onResolveGate,
    refreshGate,
  });
  const { memoCard, memoPanel } = useReceiveAddressMemo({
    selected,
    copy,
    onOpenUrl: openSupportUrl,
  });
  // The hint waits for the incident: it would lock a dialog that no longer shows the tiles.
  const shownActions = useMemo(
    () => (serviceStatus && actions.verifyHint ? { ...actions, verifyHint: undefined } : actions),
    [serviceStatus, actions],
  );

  const address = useMemo(
    () =>
      selected
        ? {
            value: selected.address,
            parts: splitAddress(selected.address),
            label: selection.options.length > 1 ? copy.addressOptionLabels[selected.id] : undefined,
            assetIcon: header.data?.assetIcon,
          }
        : undefined,
    [selected, header.data, selection.options.length, copy.addressOptionLabels],
  );

  const error =
    data.type === "error"
      ? {
          title: copy.errorTitle,
          description: copy.errorDescription,
          retryLabel: copy.retryLabel,
          onRetry,
        }
      : undefined;
  const addressSelection = selection.isSelecting
    ? {
        title: copy.selectAddressTitle,
        options: selection.options.map(({ id }) => ({ id, label: copy.addressOptionLabels[id] })),
        onSelect: selection.select,
      }
    : undefined;

  const sanctioned =
    picked && sanctionStatus === "sanctioned"
      ? {
          title: copy.sanctionedTitle,
          description: copy.sanctionedDescription(picked.address),
          closeLabel: copy.closeLabel,
          onClose,
          learnMore: {
            label: copy.learnMoreLabel,
            onPress: () => openSupportUrl(RECEIVE_URLS.sanctionedAddress),
          },
        }
      : undefined;

  return {
    isLoading: data.type === "loading" || (!!picked && sanctionStatus === "checking"),
    sanctioned,
    error,
    gate,
    addressSelection,
    address,
    actions: shownActions,
    isVerifying: verification !== undefined,
    notices,
    serviceStatus,
    helpCard,
    helpPanel,
    memoCard,
    memoPanel,
    verification,
    title: header.title,
    networkLabel: header.networkLabel,
    networkIcon: header.data?.networkIcon,
    closeLabel: header.copy.closeLabel,
    backLabel: header.copy.backLabel,
    onBack: selection.backToSelection,
    onClose,
  };
}
