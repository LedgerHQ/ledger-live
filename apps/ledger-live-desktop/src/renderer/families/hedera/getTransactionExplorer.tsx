import { ExplorerView } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";

import { HederaOperationExtra } from "@ledgerhq/live-common/families/hedera/types";

const getTransactionExplorer = (
  explorerView: ExplorerView | null | undefined,
  operation: Operation,
): string | undefined => {
  return explorerView?.tx?.replace(
    "$hash",
    (operation.extra as HederaOperationExtra).consensusTimestamp ?? "0",
  );
};

export default getTransactionExplorer;
