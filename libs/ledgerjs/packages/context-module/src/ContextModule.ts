import { ContextResponse } from "./shared/model/ContextResponse";
import { TransactionContext } from "./shared/model/TransactionContext";

export interface ContextModule {
  getContexts(transaction: TransactionContext): Promise<ContextResponse[]>;
}
