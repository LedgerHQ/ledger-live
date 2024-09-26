import type { Account, OperationType } from "@ledgerhq/types-live";
import type { MultiversxOperation } from "@ledgerhq/live-common/families/elrond/types";

export interface DetailsPropsType {
  type: OperationType;
  account: Account;
  operation: MultiversxOperation;
}
