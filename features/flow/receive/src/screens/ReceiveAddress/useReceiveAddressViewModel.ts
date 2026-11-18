import type { ReceiveAddressProps } from "./ReceiveAddress.types";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

/** Empty for now: the placeholder layout (LIVE-40948) and the screen data (LIVE-41128) fill it. */
export function useReceiveAddressViewModel({
  onClose,
}: ReceiveAddressProps): ReceiveAddressViewProps {
  return { onClose };
}
