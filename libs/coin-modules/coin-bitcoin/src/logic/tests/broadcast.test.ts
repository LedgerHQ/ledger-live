import { http, HttpResponse, type JsonBodyType } from "msw";
import { broadcast } from "../broadcast";
import { REAL_TXS, buildSignedTxHex } from "./helpers/fixtures";
import { BROADCAST_REJECTION, explorerUrl, server, testContext, useMswServer } from "./helpers/msw";

useMswServer();

const SENT_TXID = "cd".repeat(32);

type SendCall = { body: unknown; headers: Headers };

function sendHandler(
  calls: SendCall[],
  response: () => Response = () => HttpResponse.json({ result: SENT_TXID }),
  explorerId?: string,
) {
  return http.post(`${explorerUrl(explorerId)}/tx/send`, async ({ request }) => {
    calls.push({ body: await request.json(), headers: request.headers });
    return response();
  });
}

describe("broadcast (explorer wire format)", () => {
  it("submits the transaction once, as is, and returns the txid", async () => {
    const { txHex } = buildSignedTxHex();
    const calls: SendCall[] = [];
    server.use(sendHandler(calls));

    expect(await broadcast(testContext(), "bitcoin", txHex)).toBe(SENT_TXID);
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toEqual({ tx: txHex });
  });

  it("broadcasts any transaction format, e.g. komodo's", async () => {
    const calls: SendCall[] = [];
    server.use(sendHandler(calls, undefined, "kmd"));
    const { hex } = REAL_TXS.komodo;

    expect(await broadcast(testContext({ explorerId: "kmd" }), "komodo", hex)).toBe(SENT_TXID);
    expect(calls[0].body).toEqual({ tx: hex });
  });

  it.each([
    [
      "the explorer's 400 rejection",
      BROADCAST_REJECTION.status,
      BROADCAST_REJECTION.body,
      "TX decode failed",
    ],
    ["a 500", 500, { message: "internal error" }, "internal error"],
  ])("throws on %s from tx/send", async (_label, status, body, message) => {
    server.use(
      http.post(`${explorerUrl()}/tx/send`, () =>
        HttpResponse.json(body as JsonBodyType, { status }),
      ),
    );
    await expect(broadcast(testContext(), "bitcoin", buildSignedTxHex().txHex)).rejects.toThrow(
      message,
    );
  });

  it.each([
    ["an empty result", { result: "" }],
    ["a missing result", {}],
  ])("throws on a 200 with %s", async (_label, body) => {
    server.use(sendHandler([], () => HttpResponse.json(body)));
    await expect(broadcast(testContext(), "bitcoin", buildSignedTxHex().txHex)).rejects.toThrow(
      "broadcast returned no transaction id",
    );
  });

  it("forwards the transaction source as headers", async () => {
    const calls: SendCall[] = [];
    server.use(sendHandler(calls));

    await broadcast(testContext(), "bitcoin", buildSignedTxHex().txHex, {
      source: { type: "live-app", name: "my-app" },
    });
    expect(calls[0].headers.get("X-Ledger-Source-Type")).toBe("live-app");
    expect(calls[0].headers.get("X-Ledger-Source-Name")).toBe("my-app");
  });

  it("sends no source header without a source", async () => {
    const calls: SendCall[] = [];
    server.use(sendHandler(calls));

    await broadcast(testContext(), "bitcoin", buildSignedTxHex().txHex);
    expect(calls[0].headers.has("X-Ledger-Source-Type")).toBe(false);
    expect(calls[0].headers.has("X-Ledger-Source-Name")).toBe(false);
  });
});
