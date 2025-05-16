import { ExplorerView } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";

import { HederaOperationExtra } from "./types";

const getTransactionExplorer = (
  explorerView: ExplorerView | null | undefined,
  operation: Operation,
): string | undefined => {
  const extra = operation.extra as HederaOperationExtra;

  return explorerView?.tx?.replace("$hash", extra.consensusTimestamp ?? extra.transactionId ?? "0");
};

export { getTransactionExplorer };
