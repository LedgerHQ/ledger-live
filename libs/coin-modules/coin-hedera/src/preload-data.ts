import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BehaviorSubject, Observable } from "rxjs";
import type { HederaPreloadData } from "./types";

const initialData: HederaPreloadData = {
  validators: [],
};

const dataByCurrency = new Map<string, HederaPreloadData>([["hedera", initialData]]);

const dataUpdatesByCurrency = new Map([
  ["hedera", new BehaviorSubject<HederaPreloadData>(initialData)],
]);

export function setHederaPreloadData(data: HederaPreloadData, currency: CryptoCurrency): void {
  dataByCurrency.set(currency.id, data ?? initialData);
  const subject = dataUpdatesByCurrency.get(currency.id);
  if (subject === undefined) {
    throw new Error(`unsupported currency ${currency.id}`);
  }
  subject.next(data);
}

export function getHederaPreloadData(currency: CryptoCurrency): Observable<HederaPreloadData> {
  const subject = dataUpdatesByCurrency.get(currency.id);
  if (subject === undefined) {
    throw new Error(`unsupported currency ${currency.id}`);
  }
  return subject.asObservable();
}

export function getCurrentHederaPreloadData(currency: CryptoCurrency): HederaPreloadData {
  const data = dataByCurrency.get(currency.id);
  if (data === undefined) {
    throw new Error(`unsupported currency ${currency.id}`);
  }
  return data;
}
