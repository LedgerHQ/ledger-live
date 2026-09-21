import type { ReactNode } from "react";
import type { PayCardStatus } from "@domain/api-card-management";
import type { CardAssetsProps } from "@features/flow-pay-card-assets";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import type { FormattedValue } from "@ledgerhq/lumen-utils-shared";
import type { CardDetailsSceneProps } from "./components/CardDetails/Scenes/types";
import type { CardSettingsActions } from "./components/More/types";

export type { CardSettingsActions };

export type { FormattedValue };

export type CardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type CardVisualProps = Readonly<{
  balance: number;
  formatCountervalue: (value: number) => FormattedValue;
  balanceLabel: string;
  isLoading?: boolean;
}>;

export type CardVisualViewProps = CardVisualProps &
  Readonly<{
    isFrozen: boolean;
  }>;

export type CardDetailsProps = Readonly<{
  /** Balance overlay for the card face, or `undefined` to show the bare artwork. */
  cardVisual?: CardVisualProps;
  /** Native only: funding assets shown and navigated inside the card details drawer. */
  assets?: CardAssetsProps;
  /** Formats the reward wallet amount, and, natively, the transactions the overview lists. */
  formatters?: CardTransactionFormatters;
  onTrackEvent?: CardTrackEvent;
  onShowMore?: () => void;
  onTopUp?: () => void;
  cardSettingsActions?: CardSettingsActions;
}>;

export type CardDetailsViewProps = CardDetailsProps &
  Readonly<{
    detailsLabel: string;
    isSheetOpen: boolean;
    scene: CardDetailsSceneProps;
    onDetailsPress: () => void;
    onSheetClose: () => void;
    onSceneBack: () => void;
  }>;

export type CardDetailsSheetProps = Readonly<{
  isOpen: boolean;
  scene: CardDetailsSceneProps;
  onTopUp?: () => void;
  onClose: () => void;
  /** Returns to the overview from a scene the registry gives a back button. */
  onBack: () => void;
}>;

/**
 * Lifecycle of the freeze/unfreeze confirmation:
 * - `closed`: not shown
 * - `prompt`: shown, awaiting the user's confirmation
 * - `pending`: the freeze/unfreeze request is in flight
 * - `error`: the request failed and the confirmation stays open to report it
 */
export type ConfirmState = "closed" | "prompt" | "pending" | "error";

type ConfirmProps = Readonly<{
  status: PayCardStatus["status"] | undefined;
  onConfirm: () => void;
  onClose: () => void;
}>;

export type ConfirmErrorProps = ConfirmProps;

export type ConfirmPromptProps = ConfirmProps &
  Readonly<{
    isPending: boolean;
  }>;

export type ConfirmBodyProps = Readonly<{
  appearance: "error" | "info";
  titleKey: string;
  descriptionKey?: string;
  descriptionTestID?: string;
  confirmLabelKey: string;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}>;

export type ConfirmSheetProps = ConfirmProps &
  Readonly<{
    confirmState: ConfirmState;
  }>;

export type FreezeViewModel = ConfirmSheetProps &
  Readonly<{
    isActionDisabled: boolean;
    onOpenConfirm: () => void;
  }>;

export type RevealStatus = "idle" | "loading" | "flipping" | "revealed" | "failed";

export type RevealViewModel = Readonly<{
  status: RevealStatus;
  isRevealed: boolean;
  canHide: boolean;
  imageUrl: string | undefined;
  onReveal: () => Promise<void>;
  onHide: () => void;
  onImageLoad: () => void;
  onImageError: () => void;
}>;

export type RevealTileProps = Pick<RevealViewModel, "status" | "canHide" | "onReveal" | "onHide">;

export type CardFlipProps = Readonly<{
  reveal: Pick<RevealViewModel, "isRevealed" | "imageUrl" | "onImageLoad" | "onImageError"> | null;
  cardFace: ReactNode;
}>;
