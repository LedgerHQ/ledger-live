import { ClearSignContext } from "./shared/model/ClearSignContext";
import { TransactionContext } from "./shared/model/TransactionContext";

export interface ContextModule {
  getContexts(transaction: TransactionContext): Promise<ClearSignContext[]>;
}
