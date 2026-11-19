import type { ReceiveScreenData } from "./useReceiveScreenData";

export type ReceiveAddressViewProps = Readonly<{
  data: ReceiveScreenData;
  onClose: () => void;
}>;
