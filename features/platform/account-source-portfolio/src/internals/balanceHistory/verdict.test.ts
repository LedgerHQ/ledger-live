import { ETH, historyGroup, point, serverAccountId } from "../fakeService.mock";
import { verdictOf } from "./verdict";

const read = (groups: Parameters<typeof verdictOf>[2]["groups"], truncated = false) => ({
  groups,
  truncated,
});

describe("verdictOf", () => {
  it("serves the series of the range, merging the account's groups", () => {
    const verdict = verdictOf(
      ETH,
      "month",
      read([
        historyGroup(ETH, [point(ETH, { time: "2026-10-02T00:00:00Z", value: "12" })]),
        historyGroup(ETH, [
          point(ETH),
          point(ETH, { asset: "0xunknown", cal_id: null, value: "3" }),
        ]),
      ]),
    );

    expect(verdict).toEqual({
      status: "served",
      detail: "1 token points without a CAL id left out",
      history: {
        range: "month",
        series: [
          {
            assetId: "ethereum",
            points: [
              { date: "2026-10-01T00:00:00.000Z", balance: "10" },
              { date: "2026-10-02T00:00:00.000Z", balance: "12" },
            ],
          },
        ],
      },
    });
  });

  it("serves an empty history when the service has no point yet", () => {
    expect(verdictOf(ETH, "day", read([]))).toEqual({
      status: "served",
      history: { range: "day", series: [] },
    });
  });

  it.each([
    [
      "a failed group",
      read([
        { type: "error", network: "ethereum", account_id: serverAccountId(ETH), error: "boom" },
      ]),
      "The service failed its group",
    ],
    [
      "a truncated read",
      read([historyGroup(ETH)], true),
      "The history read stopped before its end",
    ],
    [
      "an unreadable point",
      read([historyGroup(ETH, [point(ETH, { value: "-1" })])]),
      "1 assets with an unreadable point",
    ],
  ])("fails %s", (_, input, detail) => {
    expect(verdictOf(ETH, "day", input)).toEqual({ status: "failed", detail });
  });
});
