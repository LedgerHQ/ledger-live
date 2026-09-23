export const CARD_FUND_REMIT_PATH = "/exchange/v1/fund/card/remit";

export const CARD_FUND_PAYLOAD_PATH = "/iframe/api/v2/user/transactions/ledger";

export function cardFundOutcomePath(orderId: string, outcome: "accepted" | "cancelled"): string {
  return `/history/webhook/v1/transaction/${encodeURIComponent(orderId)}/${outcome}`;
}
