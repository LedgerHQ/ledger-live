import Transport from "@ledgerhq/hw-transport";
import Exchange, { ExchangeTypes } from "@ledgerhq/hw-app-exchange";
import type { SellRequestEvent } from "./types";

function base64EncodeUrl(str) {
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default async (transport: Transport): Promise<SellRequestEvent> => {
  const sell = new Exchange(transport, ExchangeTypes.Sell);
  const txId = await sell.startNewTransaction();
  return {
    type: "init-sell-get-transaction-id",
    value: base64EncodeUrl(txId),
  };
};
