// @flow
import { SatStackNotReady } from "../../errors";
import type { CryptoCurrency } from "../../types";
import { isSatStackEnabled, fetchSatStackStatus } from "./satstack";

export default async function presync(currency: CryptoCurrency) {
  if (isSatStackEnabled() && currency.id === "bitcoin") {
    const status = await fetchSatStackStatus();
    if (status.type !== "ready") {
      throw new SatStackNotReady();
    }
  }
}
