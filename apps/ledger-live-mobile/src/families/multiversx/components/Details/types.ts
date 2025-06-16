import type { Account, OperationType } from "@ledgerhq/types-live";
import type { MultiversXOperation } from "@ledgerhq/live-common/families/multiversx/types";

export interface DetailsPropsType {
  type: OperationType;
  account: Account;
  operation: MultiversXOperation;
}
