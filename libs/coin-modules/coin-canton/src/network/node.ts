import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function getLedgerEnd(_currency: CryptoCurrency): Promise<number> {
  return new Promise((_, reject) => {
    reject(new Error("not implemented"));
  });
}

export async function getNextSequence(_address: string): Promise<number> {
  return new Promise((_, reject) => {
    reject(new Error("not implemented"));
  });
}
