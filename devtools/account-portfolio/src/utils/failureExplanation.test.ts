import type { AccountPortfolioResult } from "../types";
import { explainFailure, httpStatusOf } from "./failureExplanation";

const failed = (body: unknown): AccountPortfolioResult => ({
  ok: false,
  durationMs: 1,
  sent: { method: "GET", url: "https://portfolio.test/v1/networks" },
  body,
  currency: "usd",
});

describe("httpStatusOf", () => {
  it("reads a numeric status", () => {
    expect(httpStatusOf(failed({ status: 404 }))).toBe(404);
  });

  it("falls back to originalStatus when the body was not JSON", () => {
    expect(
      httpStatusOf(failed({ status: "PARSING_ERROR", originalStatus: 502, error: "SyntaxError" })),
    ).toBe(502);
  });
});

describe("explainFailure", () => {
  it("explains a response that does not match the schema", () => {
    expect(
      explainFailure(
        "getPortfolio",
        failed({ status: 200, data: { id: 1 }, issues: [{ path: ["id"] }] }),
      ),
    ).toMatch(/does not match the schema/);
  });
});
