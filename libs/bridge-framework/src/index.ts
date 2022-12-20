import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountBridge,
  AccountLike,
  CurrencyBridge,
  TransactionCommon
} from "@ledgerhq/types-live";
import Bridge from "./bridge/new";

const impl = Bridge.getInstance();

export type Proxy = {
  getAccountBridge: typeof getAccountBridge;
  getCurrencyBridge: typeof getCurrencyBridge;
};
let proxy: Proxy | null | undefined;

export const setBridgeProxy = (p?: Proxy | null): void => {
  if (p?.getAccountBridge === getAccountBridge) {
    throw new Error(
      "setBridgeProxy can't be called with same bridge functions!"
    );
  }

  proxy = p;
};

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge =>
  (proxy || impl).getCurrencyBridge(currency);

export const getAccountBridge = <T extends TransactionCommon = TransactionCommon>(
  account: AccountLike,
  parentAccount?: Account | null
): AccountBridge<T> => (proxy || impl).getAccountBridge(account, parentAccount);
