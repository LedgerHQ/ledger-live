import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";
import { useReceiveScreenData } from "./useReceiveScreenData";

export function useReceiveAddressViewModel({
  accountUUID,
  assetId,
  onClose,
}: ReceiveAddressProps): ReceiveAddressViewProps {
  const { data } = useReceiveScreenData(accountUUID, assetId);
  return { data, onClose };
}
