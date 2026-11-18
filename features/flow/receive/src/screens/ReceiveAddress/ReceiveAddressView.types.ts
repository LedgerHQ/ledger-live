import type { AddressParts } from "../../logic/splitAddress";
import type { ReceiveIcon } from "../../logic/toReceiveAddressData";
import type { ReceiveAddressOptionId } from "../../logic/toReceiveAddressOptions";
import type { ReceiveServiceIncident } from "../../types";

export type ReceiveAddressError = Readonly<{
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
}>;

export type ReceiveAddressSelectionView = Readonly<{
  title: string;
  options: readonly Readonly<{ id: ReceiveAddressOptionId; label: string }>[];
  onSelect: (id: ReceiveAddressOptionId) => void;
}>;

export type ReceiveAddressShown = Readonly<{
  value: string;
  parts: AddressParts;
  label?: string;
  assetIcon: ReceiveIcon;
}>;

type ReceiveAddressAction = Readonly<{ label: string; onPress: () => void }>;

export type ReceiveAddressActionsView = Readonly<{
  disabled: boolean;
  copy?: ReceiveAddressAction &
    Readonly<{
      hasCopied: boolean;
      /** Copies from a press on the QR code, which plays its own animation. */
      onPressCode: () => void;
      /** How many times the Copy button was pressed: the QR code replays its animation on each. */
      buttonPresses: number;
    }>;
  share?: ReceiveAddressAction;
  verify?: ReceiveAddressAction & Readonly<{ disabled: boolean }>;
  verifyHint?: Readonly<{ message: string; gotItLabel: string; onGotIt: () => void }>;
}>;

export type ReceiveNoticeView = Readonly<{
  id: string;
  tone: "info" | "warning";
  text: string;
  learnMore?: ReceiveAddressAction;
}>;

export type ReceiveServiceWarningView = Readonly<{
  title: string;
  ctaLabel: string;
  onPress: () => void;
}>;

export type ReceiveServiceStatusView = Readonly<{
  title: string;
  incidents: readonly ReceiveServiceIncident[];
  gotItLabel: string;
  onClose: () => void;
}>;

export type ReceiveMemoCardView = Readonly<{ title: string; onPress: () => void }>;

export type ReceiveMemoPanelView = Readonly<{
  title: string;
  description: string;
  gotItLabel: string;
  learnMore?: ReceiveAddressAction;
  onClose: () => void;
}>;

export type ReceiveHelpCardView = Readonly<{ title: string; onPress: () => void }>;

export type ReceiveHelpPanelView = Readonly<{
  title: string;
  questions: readonly (ReceiveAddressAction & Readonly<{ id: string }>)[];
  onClose: () => void;
}>;

export type ReceiveSanctionedView = Readonly<{
  title: string;
  description: string;
  closeLabel: string;
  onClose: () => void;
  learnMore?: ReceiveAddressAction;
}>;

export type ReceiveBlockedView = Readonly<{
  title: string;
  description: string;
  continueAction?: ReceiveAddressAction;
}>;

export type ReceiveAddressViewProps = Readonly<{
  isLoading: boolean;
  error?: ReceiveAddressError;
  sanctioned?: ReceiveSanctionedView;
  blocked?: ReceiveBlockedView;
  addressSelection?: ReceiveAddressSelectionView;
  address?: ReceiveAddressShown;
  actions: ReceiveAddressActionsView;
  notices: readonly ReceiveNoticeView[];
  serviceWarning?: ReceiveServiceWarningView;
  serviceStatus?: ReceiveServiceStatusView;
  memoCard?: ReceiveMemoCardView;
  memoPanel?: ReceiveMemoPanelView;
  helpCard?: ReceiveHelpCardView;
  helpPanel?: ReceiveHelpPanelView;
  title: string;
  networkLabel: string;
  networkIcon?: ReceiveIcon;
  onBack?: () => void;
  onClose: () => void;
  closeLabel: string;
  backLabel: string;
}>;
