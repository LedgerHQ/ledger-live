import type { Account, OperationType } from "@ledgerhq/types-live";
import type { ElrondOperation } from "@ledgerhq/live-common/families/elrond/types";

export interface DetailsPropsType {
  type: OperationType;
  account: Account;
  operation: ElrondOperation;
}
