import { ContextResponse } from "./shared/model/ContextResponse";
import { LoaderOptions } from "./shared/model/LoaderOptions";
import { Transaction } from "./shared/model/Transaction";

export interface ContextModule {
  getContexts(transaction: Transaction, options: LoaderOptions): Promise<ContextResponse[]>;
}
