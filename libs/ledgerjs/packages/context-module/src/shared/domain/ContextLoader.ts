import { ContextResponse } from "../model/ContextResponse";
import { LoaderOptions } from "../model/LoaderOptions";
import { Transaction } from "../model/Transaction";

export type ContextLoader = {
  load: (transaction: Transaction, options: LoaderOptions) => Promise<ContextResponse[]>;
};
