import type { ExplorerView } from "@ledgerhq/types-cryptoassets";
import type { Operation } from "@ledgerhq/types-live";
import type { HederaOperationExtra } from "./types";

const getTransactionExplorer = (
  explorerView: ExplorerView | null | undefined,
  operation: Operation,
): string | undefined => {
  const extra = isValidExtra(operation.extra) ? operation.extra : null;

  return explorerView?.tx?.replace(
    "$hash",
    extra?.consensusTimestamp ?? extra?.transactionId ?? "0",
  );
};

const isValidExtra = (extra: unknown): extra is HederaOperationExtra => {
  return !!extra && typeof extra === "object" && !Array.isArray(extra);
};

export { getTransactionExplorer, isValidExtra };
