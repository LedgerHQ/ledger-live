import type {
  AssetInfo,
  Balance,
  FeeEstimation,
  Memo,
  MemoNotSupported,
  TransactionIntent,
  TransactionValidation,
  TxData,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation as LiveOperation } from "@ledgerhq/types-live";

export type AddressValidationCurrencyParameters = {
  currency: CryptoCurrency;
  networkId: number;
};

export type ChainSpecificRules = {
  getAccountShape: (address: string) => void;
  getTransactionStatus: {
    throwIfPendingOperation?: boolean;
  };
};

export type BridgeApi<
  MemoType extends Memo = MemoNotSupported,
  TxDataType extends TxData = TxDataNotSupported,
> = {
  validateIntent: (
    transactionIntent: TransactionIntent<MemoType, TxDataType>,
    balances: Balance[],
    customFees?: FeeEstimation,
  ) => Promise<TransactionValidation>;
  getSequence: (address: string) => Promise<bigint>;
  getChainSpecificRules?: () => ChainSpecificRules;
  getTokenFromAsset?: (asset: AssetInfo) => Promise<TokenCurrency | undefined>;
  getAssetFromToken?: (token: TokenCurrency, owner: string) => AssetInfo;
  computeIntentType?: (transaction: Record<string, unknown>) => string;
  refreshOperations?: (operations: LiveOperation[]) => Promise<LiveOperation[]>;
};
