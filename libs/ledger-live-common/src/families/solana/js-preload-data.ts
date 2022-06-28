import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BehaviorSubject, Observable } from "rxjs";
import { SolanaPreloadDataV1 } from "./types";

const initialData: SolanaPreloadDataV1 = {
  version: "1",
  validatorsWithMeta: [],
  validators: [],
};

const dataByCurrency = new Map<string, SolanaPreloadDataV1>([
  ["solana", initialData],
  ["solana_testnet", initialData],
  ["solana_devnet", initialData],
]);

const dataUpdatesByCurrency = new Map([
  ["solana", new BehaviorSubject<SolanaPreloadDataV1>(initialData)],
  ["solana_testnet", new BehaviorSubject<SolanaPreloadDataV1>(initialData)],
  ["solana_devnet", new BehaviorSubject<SolanaPreloadDataV1>(initialData)],
]);

export function setSolanaPreloadData(
  data: SolanaPreloadDataV1,
  currency: CryptoCurrency
): void {
  dataByCurrency.set(currency.id, data);
  const subject = dataUpdatesByCurrency.get(currency.id);
  if (subject === undefined) {
    throw new Error(`unsupported currency ${currency.id}`);
  }
  subject.next(data);
}

export function getSolanaPreloadData(
  currency: CryptoCurrency
): Observable<SolanaPreloadDataV1> {
  const subject = dataUpdatesByCurrency.get(currency.id);
  if (subject === undefined) {
    throw new Error(`unsupported currency ${currency.id}`);
  }
  return subject.asObservable();
}

export function getCurrentSolanaPreloadData(
  currency: CryptoCurrency
): SolanaPreloadDataV1 {
  const data = dataByCurrency.get(currency.id);
  if (data === undefined) {
    throw new Error(`unsupported currency ${currency.id}`);
  }
  return data;
}
