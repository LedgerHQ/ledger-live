import type { Account, AccountLike } from "@ledgerhq/types-live";

export type ClaimFundsButtonProps = {
  account: AccountLike;
  parentAccount?: Account | null;
};

export type ClaimFundsButtonViewProps = {
  isVisible: boolean;
  isClaiming: boolean;
  error: string | undefined;
  onClaim: () => void;
};
