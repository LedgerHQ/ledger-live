/**
 * Integration tests — craftTransaction fetches nonce from the real API.
 */
import { createNetworkApi } from "../../network/api";
import { craftTransaction } from "./craftTransaction";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { CHAIN_ID } from "../../constants";

const API_ENDPOINT = process.env.MULTIVERSX_API_ENDPOINT ?? "https://api.multiversx.com";
const DELEGATION_API_ENDPOINT =
  process.env.MULTIVERSX_DELEGATION_API_ENDPOINT ?? "https://delegation-api.multiversx.com";

const SENDER = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
const RECIPIENT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

describe("craftTransaction (integration)", () => {
  const api = createNetworkApi(API_ENDPOINT, DELEGATION_API_ENDPOINT);

  it("crafts a native EGLD transaction with real nonce", async () => {
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1000000000000000n,
      asset: { type: "native" },
    };
    const result = await craftTransaction(api, intent);
    const tx = JSON.parse(result.transaction);

    expect(tx.chainID).toBe(CHAIN_ID);
    expect(typeof tx.nonce).toBe("number");
    expect(tx.nonce).toBeGreaterThanOrEqual(0);
    expect(tx.sender).toBe(SENDER);
    expect(tx.receiver).toBe(RECIPIENT);
  });
});
