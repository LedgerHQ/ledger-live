import { ContextResponse } from "../model/ContextResponse";
import { TransactionContext } from "../model/TransactionContext";

export type ContextLoader = {
  load: (transaction: TransactionContext) => Promise<ContextResponse[]>;
};
