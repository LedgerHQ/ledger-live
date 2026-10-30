import { serverAccountId } from "../../evm";
import { ETH, PORTFOLIO_ID, fakeService, update } from "../fakeService.mock";
import { limitOf, readUpdates } from "./read";

describe("limitOf", () => {
  it.each([
    [undefined, 20],
    [{}, 20],
    [{ limit: 5 }, 5],
    [{ limit: 0 }, 20],
    [{ limit: 2.5 }, 20],
  ])("reads %j as %i", (query, limit) => {
    expect(limitOf(query)).toBe(limit);
  });
});

describe("readUpdates", () => {
  it("reads one page of the account, forwarding the limit and the cursor as page token", async () => {
    const { client } = fakeService({
      updates: [update(ETH, { tx: { hash: "0x1" } }), update(ETH, { tx: { hash: "0x2" } })],
    });

    const page = await readUpdates(client, PORTFOLIO_ID, ETH, { limit: 1, cursor: "1" });

    expect(client.getUpdates.mock.calls.map(([, params]) => params)).toEqual([
      { account: serverAccountId(ETH), size: 1, token: "1" },
    ]);
    expect(page.items.map(item => item.tx.hash)).toEqual(["0x2"]);
  });
});
