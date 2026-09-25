import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import type { CardTopUpDeviceStep } from "../../hooks/useCardTopUpExecution";

export type CardTopUpData = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  asset: CardAssetRow;
}>;

export type CardTopUpViewModel = Readonly<{
  asset: CardAssetRow;
  amountText: string;
  maxDecimalLength: number;
  availableBalance: string;
  sourceAccountName: string;
  amountError: string | null;
  canSubmit: boolean;
  deviceStep: CardTopUpDeviceStep;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onDeviceError: (error: Error) => void;
  onClose: () => void;
}>;
