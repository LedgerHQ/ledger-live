import type { PayCardCashbackResponse } from "./types";

export function mockPayCardCashback(): PayCardCashbackResponse {
  return {
    amount: "0.00294697",
    currency: "BTC",
    network: "bitcoin",
    ratePercent: "1",
  };
}
