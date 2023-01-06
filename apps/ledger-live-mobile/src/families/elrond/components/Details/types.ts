import type { Account, OperationType, Operation } from "@ledgerhq/types-live";

export interface DetailsPropsType {
  type: OperationType;
  account: Account;
  operation: Operation;
  extra: {
    amount: string;
    memo?: string;
  };
}
