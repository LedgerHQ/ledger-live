import type { AssetInfo, BlockTransaction, Page } from "@ledgerhq/coin-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation as LiveOperation } from "@ledgerhq/types-live";

export type ChainSpecificRules = {
  getAccountShape: (address: string) => void;
  getTransactionStatus: {
    throwIfPendingOperation?: boolean;
  };
};

export type BridgeApi = {
  getChainSpecificRules?: () => ChainSpecificRules;
  getTokenFromAsset?: (asset: AssetInfo) => Promise<TokenCurrency | undefined>;
  getAssetFromToken?: (token: TokenCurrency, owner: string) => AssetInfo;
  computeIntentType?: (transaction: Record<string, unknown>) => string;
  refreshOperations?: (operations: LiveOperation[]) => Promise<LiveOperation[]>;
  validateTransaction?: (signature: string) => Promise<{ error: Error | undefined }>;
  getPendingTransactions?: (address: string) => Promise<Page<BlockTransaction>>;
};
