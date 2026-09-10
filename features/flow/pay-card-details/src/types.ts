import type { ReactNode } from "react";
import type { PayCardStatus } from "@domain/api-card-management";
import type { FormattedValue } from "@ledgerhq/lumen-utils-shared";

export type { FormattedValue };

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

export type ConfirmState = "closed" | "idle" | "pending" | "error";

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

export type TileProps = ConfirmSheetProps &
  Readonly<{
    isActionDisabled: boolean;
    onOpenConfirm: () => void;
  }>;

export type UnlockForCardNumbers = () => Promise<boolean>;

export type CardNumbersProps = Readonly<{
  unlock: UnlockForCardNumbers;
  cardFace?: ReactNode;
}>;

export type CardNumbersStatus = "idle" | "loading" | "revealed" | "failed";

export type CardNumbersViewProps = Readonly<{
  status: CardNumbersStatus;
  imageUrl: string | undefined;
  onReveal: () => Promise<void>;
  onHide: () => void;
  onImageError: () => void;
  cardFace?: ReactNode;
}>;
