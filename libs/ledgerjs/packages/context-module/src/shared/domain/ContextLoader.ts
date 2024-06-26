import { ClearSignContext } from "../model/ClearSignContext";
import { TransactionContext } from "../model/TransactionContext";

export type ContextLoader = {
  load: (transaction: TransactionContext) => Promise<ClearSignContext[]>;
};
