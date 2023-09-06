import { ExplorerView } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";

const getTransactionExplorer = (
        explorerView: ExplorerView | null | undefined, operation: Operation
    ): string | null | undefined => 
        explorerView && explorerView.tx && explorerView.tx.replace("$hash", operation.extra.consensusTimeStamp);

export default getTransactionExplorer;