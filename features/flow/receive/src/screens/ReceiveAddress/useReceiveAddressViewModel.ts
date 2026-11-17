import { useMemo } from "react";
import type { UseVerifyAddressExecutorViewModelParams } from "../../hooks/useVerifyAddressExecutorViewModel";
import { splitAddress } from "../../logic/splitAddress";
import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";
import { useReceiveAddressActions } from "./useReceiveAddressActions";
import { useReceiveAddressHeader } from "./useReceiveAddressHeader";
import { useReceiveAddressHelp } from "./useReceiveAddressHelp";
import { useReceiveAddressMemo } from "./useReceiveAddressMemo";
import { useReceiveAddressNotices } from "./useReceiveAddressNotices";
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
}: ReceiveAddressProps): ReceiveAddressViewModel {
  const { descriptor, data, accountStatus } = useReceiveScreenData(accountUUID, assetId);
  const header = useReceiveAddressHeader(descriptor, assetId);
  const receive = data.type === "ready" ? data.receive : undefined;
  const selection = useReceiveAddressSelection(receive);
  const familyConfig = useReceiveFamilyConfig({
    getFamilyConfig,
    descriptor,
    asset: header.asset,
    receive,
    accountStatus,
  });
  const { copy } = header;
  const { selected } = selection;
  const { actions, verification } = useReceiveAddressActions({
    accountUUID,
    assetId,
    selected,
    familyConfig,
    copy,
    hasVerifyExecutor: !!VerifyAddressExecutor,
    onCopyAddress,
    onShareAddress,
    onClose,
  });

  const { panel, openPanel, closePanel } = useReceiveAddressPanel();
  const { notices, serviceWarning } = useReceiveAddressNotices({
    familyConfig,
    selected,
    serviceIncidents,
    copy,
    onOpenUrl,
    openServiceStatus: () => openPanel("serviceStatus"),
  });

  const { memoCard, memoPanel } = useReceiveAddressMemo({
    selected,
    isOpen: panel === "memo",
    copy,
    onOpenUrl,
    open: () => openPanel("memo"),
    close: closePanel,
  });

  const { helpCard, helpPanel } = useReceiveAddressHelp({
    isOpen: panel === "help",
    copy,
    onOpenUrl,
    open: () => openPanel("help"),
    close: closePanel,
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

  return {
    isLoading: data.type === "loading",
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
    onClose,
  };
}
