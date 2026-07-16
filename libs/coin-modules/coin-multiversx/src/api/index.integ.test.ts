/**
 * Integration tests for createApi factory.
 * Verifies unsupported methods throw and craft→combine produces valid shape.
 */
import { createApi } from "./index";
import type { MultiversXCoinConfig } from "../config";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { CHAIN_ID } from "../constants";

const config: MultiversXCoinConfig = {
  status: { type: "active" },
  apiEndpoint: process.env.MULTIVERSX_API_ENDPOINT ?? "https://api.multiversx.com",
  delegationApiEndpoint:
    process.env.MULTIVERSX_DELEGATION_API_ENDPOINT ?? "https://delegation-api.multiversx.com",
};

const SENDER = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
const RECIPIENT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

describe("createApi factory (integration)", () => {
  const api = createApi(config, "elrond");

  // Unsupported-method assertions live in index.unit.test.ts — they throw
  // synchronously and require no network.

  it("craft → combine produces valid signed JSON with correct shape", async () => {
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1000000000000000n,
      asset: { type: "native" },
    };

    const crafted = await api.craftTransaction(intent);
    const unsignedTx = JSON.parse(crafted.transaction);

    expect(unsignedTx.chainID).toBe(CHAIN_ID);
    expect(unsignedTx.sender).toBe(SENDER);
    expect(unsignedTx.receiver).toBe(RECIPIENT);
    expect(unsignedTx.signature).toBeUndefined();

    const fakeSignature = "a".repeat(128);
    const signedStr = await api.combine(crafted.transaction, fakeSignature);
    const signedTx = JSON.parse(signedStr);

    expect(signedTx.signature).toBe(fakeSignature);
    expect(signedTx.chainID).toBe(CHAIN_ID);
    expect(typeof signedTx.nonce).toBe("number");
  });

  it("craft → combine for ESDT produces data field", async () => {
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 100n,
      asset: { type: "esdt", assetReference: "USDC-c76f1f" },
    };

    const crafted = await api.craftTransaction(intent);
    const unsignedTx = JSON.parse(crafted.transaction);
    // data must be base64-encoded per the MultiversX protocol
    expect(Buffer.from(unsignedTx.data, "base64").toString()).toMatch(/^ESDTTransfer@/);
    expect(unsignedTx.value).toBe("0");
  });
});
