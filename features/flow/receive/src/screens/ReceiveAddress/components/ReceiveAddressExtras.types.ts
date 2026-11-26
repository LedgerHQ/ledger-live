import type { ReceiveHelpCardView, ReceiveMemoCardView } from "../ReceiveAddressView.types";

export type ReceiveAddressExtrasProps = Readonly<{
  memoCard?: ReceiveMemoCardView;
  helpCard: ReceiveHelpCardView;
}>;
