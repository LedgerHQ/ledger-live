import { useMemo } from "react";
import { splitAddress } from "../../logic/splitAddress";
import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";
import { useReceiveAddressHeader } from "./useReceiveAddressHeader";
import { useReceiveAddressSelection } from "./useReceiveAddressSelection";
import { useReceiveScreenData } from "./useReceiveScreenData";

export function useReceiveAddressViewModel({
  accountUUID,
  assetId,
  onClose,
}: ReceiveAddressProps): ReceiveAddressViewProps {
  const { descriptor, data } = useReceiveScreenData(accountUUID, assetId);
  const header = useReceiveAddressHeader(descriptor, assetId);
  const selection = useReceiveAddressSelection(data.type === "ready" ? data.receive : undefined);
  const { copy } = header;
  const { selected } = selection;

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
    title: header.title,
    networkLabel: header.networkLabel,
    networkIcon: header.data?.networkIcon,
    onBack: selection.backToSelection,
    onClose,
  };
}
