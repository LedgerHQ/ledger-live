import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";
import { useReceiveAddressHeader } from "./useReceiveAddressHeader";
import { useReceiveScreenData } from "./useReceiveScreenData";

export function useReceiveAddressViewModel({
  accountUUID,
  assetId,
  onClose,
}: ReceiveAddressProps): ReceiveAddressViewProps {
  const { descriptor, data } = useReceiveScreenData(accountUUID, assetId);
  const header = useReceiveAddressHeader(descriptor, assetId);

  return {
    data,
    title: header.title,
    networkLabel: header.networkLabel,
    networkIcon: header.data?.networkIcon,
    onClose,
  };
}
