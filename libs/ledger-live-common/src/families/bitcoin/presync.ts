import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { requiresSatStackReady } from "./satstack";
export default async function presync(currency: CryptoCurrency): Promise<void> {
  if (currency.id === "bitcoin") {
    await requiresSatStackReady();
  }
}
