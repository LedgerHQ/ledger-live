/** Card is the only product the transaction manager exposes a fund remit for. */
export const FUND_CARD_REMIT_PATH = "/exchange/v1/fund/card/remit";

export const fundOutcomePath = (quoteId: string, outcome: "accepted" | "cancelled") =>
  `/history/webhook/v1/transaction/${quoteId}/${outcome}`;
