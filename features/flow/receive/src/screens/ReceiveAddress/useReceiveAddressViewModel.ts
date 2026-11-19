import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

/** Static for now: the screen data (LIVE-41128) and each zone task fill it. */
export function useReceiveAddressViewModel({
  onClose,
}: ReceiveAddressProps): ReceiveAddressViewProps {
  return { onClose };
}
