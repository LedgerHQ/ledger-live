import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BehaviorSubject, Observable } from "rxjs";
import { AptosPreloadData } from "./types";

const initialData: AptosPreloadData = {
  validatorsWithMeta: [],
  validators: [],
};

const dataByCurrency = new Map<string, AptosPreloadData>([
  ["aptos", initialData],
  ["aptos_testnet", initialData],
]);

const dataUpdatesByCurrency = new Map([
  ["aptos", new BehaviorSubject<AptosPreloadData>(initialData)],
  ["aptos_testnet", new BehaviorSubject<AptosPreloadData>(initialData)],
]);

export function setAptosPreloadData(data: AptosPreloadData, currency: CryptoCurrency): void {
  dataByCurrency.set(currency.id, data);
  const subject = dataUpdatesByCurrency.get(currency.id);
  if (subject === undefined) {
    throw new Error(`unsupported currency ${currency.id}`);
  }
  subject.next(data);
}

export function getAptosPreloadData(currency: CryptoCurrency): Observable<AptosPreloadData> {
  const subject = dataUpdatesByCurrency.get(currency.id);
  if (subject === undefined) {
    throw new Error(`unsupported currency ${currency.id}`);
  }
  return subject.asObservable();
}

export function getCurrentAptosPreloadData(currency: CryptoCurrency): AptosPreloadData {
  const data = dataByCurrency.get(currency.id);
  if (data === undefined) {
    throw new Error(`unsupported currency ${currency.id}`);
  }
  return data;
}
