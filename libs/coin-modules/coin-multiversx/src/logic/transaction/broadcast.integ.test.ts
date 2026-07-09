/**
 * Integration test — broadcasts against the real MultiversX gateway.
 *
 * We only exercise the failure path: submitting a malformed transaction must be
 * rejected by the live gateway (so broadcast throws). We do NOT test the success
 * path here because a valid broadcast would require a signed, funded transaction.
 * Success/parse behaviour is covered by the unit and msw layers.
 */
import { createNetworkApi } from "../../network/api";
import { broadcast } from "./broadcast";

const API_ENDPOINT = process.env.MULTIVERSX_API_ENDPOINT ?? "https://api.multiversx.com";
const DELEGATION_API_ENDPOINT =
  process.env.MULTIVERSX_DELEGATION_API_ENDPOINT ?? "https://delegation-api.multiversx.com";

describe("broadcast (integration)", () => {
  const api = createNetworkApi(API_ENDPOINT, DELEGATION_API_ENDPOINT);

  it("rejects a malformed transaction sent to the live gateway", async () => {
    // Not a valid signed MultiversX transaction — the gateway must reject it and
    // broadcast must surface the failure rather than returning an empty hash.
    const malformed = JSON.stringify({ nonce: 0, sender: "invalid", signature: "00" });

    await expect(broadcast(api, malformed)).rejects.toThrow();
  });
});
