import { http, HttpResponse } from "msw";
import { server, TEST_COSMOS_ENDPOINT, makeTestApi } from "../../test/msw.mock";
import { broadcast } from "./broadcast";

const TXS = `${TEST_COSMOS_ENDPOINT}/cosmos/tx/v1beta1/txs`;
// Opaque hex payload — broadcast() forwards it to the LCD as-is (see broadcast.ts); the stubbed
// LCD response, not the payload's validity, drives every assertion below.
const TX_HEX = "deadbeef";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("broadcast via MSW", () => {
  it("returns the tx hash on a successful broadcast (code 0)", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.post(TXS, () => HttpResponse.json({ tx_response: { code: 0, txhash: "ABC123" } })),
    );

    const hash = await broadcast(api, TX_HEX);

    expect(hash).toBe("ABC123");
  });

  // assertBroadcastOk throws for any non-zero code other than 32, embedding the code + raw_log.
  it("throws on a non-zero broadcast code", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.post(TXS, () =>
        HttpResponse.json({ tx_response: { code: 5, raw_log: "insufficient funds" } }),
      ),
    );

    await expect(broadcast(api, TX_HEX)).rejects.toThrow(/insufficient funds/);
  });

  // Code 32 is cosmos-sdk ErrWrongSequence; assertBroadcastOk maps it specifically to
  // SequenceNumberError (LIVE-11301: the cosmos LCD proxy can return a stale account sequence).
  // SequenceNumberError's message defaults to the error name, which is what the matcher checks.
  it("throws SequenceNumberError on broadcast code 32 (stale account sequence)", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.post(TXS, () =>
        HttpResponse.json({ tx_response: { code: 32, raw_log: "account sequence mismatch" } }),
      ),
    );

    await expect(broadcast(api, TX_HEX)).rejects.toThrow("SequenceNumberError");
  });

  // broadcastRawTransaction checks for an empty txhash *after* assertBroadcastOk, so a code:0
  // response with an empty hash throws its own, separate error.
  it("throws when the broadcast returns an empty transaction hash", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(http.post(TXS, () => HttpResponse.json({ tx_response: { code: 0, txhash: "" } })));

    await expect(broadcast(api, TX_HEX)).rejects.toThrow(/empty transaction hash/);
  });
});
