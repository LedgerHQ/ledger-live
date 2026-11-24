import { useMemo } from "react";
import type { UseVerifyAddressExecutorViewModelParams } from "../../hooks/useVerifyAddressExecutorViewModel";
import { splitAddress } from "../../logic/splitAddress";
import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";
import { useReceiveAddressActions } from "./useReceiveAddressActions";
import { useReceiveAddressHeader } from "./useReceiveAddressHeader";
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
  });

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
          onRetry: data.retry,
        }
      : undefined;
  const addressSelection = selection.isSelecting
    ? {
        title: copy.selectAddressTitle,
        options: selection.options.map(({ id }) => ({ id, label: copy.addressOptionLabels[id] })),
        onSelect: selection.select,
      }
    : undefined;
  const actionsPlaceholderLabel = [actions.copy, actions.share, actions.verify]
    .map(action => action?.label)
    .filter(Boolean)
    .join(" · ");

  return {
    isLoading: data.type === "loading",
    error,
    addressSelection,
    address,
    actions,
    actionsPlaceholderLabel,
    isVerifying: verification !== undefined,
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
