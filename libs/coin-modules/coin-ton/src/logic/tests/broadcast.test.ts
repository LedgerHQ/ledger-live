import { Address, beginCell, external, storeMessage } from "@ton/core";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import { OWNER } from "../../test/history.fixtures";
import { broadcast } from "../broadcast";

const message = beginCell()
  .store(storeMessage(external({ to: Address.parse(OWNER), body: beginCell().endCell() })))
  .endCell();
const boc = message.toBoc().toString("base64");

describe("broadcast", () => {
  const server = setupServer();
  const context = createMockTonContext();

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("posts the message and returns its hash, the one its synced operation carries", async () => {
    let posted: unknown;
    server.use(
      http.post(`${TON_API_MOCKED}/message`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ message_hash: "normalized", message_hash_norm: "normalized" });
      }),
    );

    await expect(broadcast(context, boc)).resolves.toBe(message.hash().toString("base64"));
    expect(posted).toEqual({ boc });
  });

  it("refuses an answer that acknowledges no message", async () => {
    server.use(http.post(`${TON_API_MOCKED}/message`, () => HttpResponse.json({})));

    await expect(broadcast(context, boc)).rejects.toThrow(
      "The TON node did not acknowledge the message",
    );
  });

  it("surfaces the node's rejection", async () => {
    server.use(
      http.post(`${TON_API_MOCKED}/message`, () =>
        HttpResponse.json({ error: "Failed to unpack account state" }, { status: 409 }),
      ),
    );

    await expect(broadcast(context, boc)).rejects.toThrow("Failed to unpack account state");
  });
});
