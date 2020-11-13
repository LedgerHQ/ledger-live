// @flow
import type Transport from "@ledgerhq/hw-transport";
import Exchange from "../hw-app-exchange/Exchange";
import type { SellRequestEvent } from "./types";

function base64EncodeUrl(str) {
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default async (transport: Transport<*>): Promise<SellRequestEvent> => {
  const sell = new Exchange(transport, 0x01);
  const txId = await sell.startNewTransaction();
  return {
    type: "init-sell-get-transaction-id",
    value: base64EncodeUrl(txId),
  };
};
