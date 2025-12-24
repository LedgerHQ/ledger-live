import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function getLedgerEnd(_currency: CryptoCurrency): Promise<number> {
  return Promise.reject(new Error("getLedgerEnd not implemented"));
}

export async function getNextSequence(_address: string): Promise<number> {
  return Promise.reject(new Error("getNextSequence not implemented"));
}
