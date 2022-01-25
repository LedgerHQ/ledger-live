import type { CryptoCurrency } from "../../types";
import { requiresSatStackReady } from "./satstack";
export default async function presync(currency: CryptoCurrency) {
  if (currency.id === "bitcoin") {
    await requiresSatStackReady();
  }
}
