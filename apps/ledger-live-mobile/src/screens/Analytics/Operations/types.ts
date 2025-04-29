import { AccountLike, AccountLikeArray, DailyOperationsSection } from "@ledgerhq/types-live";

export type ListProps = Props & {
  onEndReached?: () => void;
  sections: DailyOperationsSection[];
  completed: boolean;
};

export type Props = {
  accountsFiltered: AccountLike[];
  allAccounts: AccountLikeArray;
  onTransactionButtonPress?: () => void;
};
