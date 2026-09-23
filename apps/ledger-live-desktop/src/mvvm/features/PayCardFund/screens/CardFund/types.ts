import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import type { CardFundDeviceStep } from "../../hooks/useCardFundExecution";

export type CardFundData = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  asset: CardAssetRow;
}>;

export type CardFundViewModel = Readonly<{
  asset: CardAssetRow;
  amountText: string;
  maxDecimalLength: number;
  availableBalance: string;
  sourceAccountName: string;
  amountError: string | null;
  canSubmit: boolean;
  deviceStep: CardFundDeviceStep;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onDeviceError: (error: Error) => void;
  onClose: () => void;
}>;
