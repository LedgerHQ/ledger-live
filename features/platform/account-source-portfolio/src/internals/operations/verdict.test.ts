import { ETH, update } from "../fakeService.mock";
import { verdictOf } from "./verdict";

describe("verdictOf", () => {
  it("serves the page with the service's next token as cursor", () => {
    expect(verdictOf(ETH, { items: [update(ETH)], nextToken: "t2" })).toMatchObject({
      status: "served",
      page: { operations: [{ id: "ethereum-0xabc-IN" }], nextCursor: "t2" },
    });
  });

  it("serves the last page without a cursor, saying which token changes were left out", () => {
    const verdict = verdictOf(ETH, {
      items: [update(ETH, { deltas: [{ asset: "token", cal_id: null, amount: "1" }] })],
      nextToken: null,
    });
    expect(verdict).toMatchObject({
      status: "served",
      detail: "1 token changes without a CAL id left out",
    });
    expect(verdict.status === "served" && "nextCursor" in verdict.page).toBe(false);
  });

  it("fails a page with an unreadable update", () => {
    expect(verdictOf(ETH, { items: [update(ETH, { time: "" })] })).toEqual({
      status: "failed",
      detail: "1 unreadable updates",
    });
  });
});
