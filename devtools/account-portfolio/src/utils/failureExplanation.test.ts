import type { AccountPortfolioResult } from "../types";
import { explainFailure, httpStatusOf } from "./failureExplanation";

const failed = (body: unknown): AccountPortfolioResult => ({
  ok: false,
  durationMs: 1,
  sent: { method: "GET", url: "https://portfolio.test/v1/portfolio/p" },
  body,
  currency: "usd",
});

describe("explainFailure", () => {
  it("reads the status of a non-JSON body", () => {
    expect(
      httpStatusOf(failed({ status: "PARSING_ERROR", originalStatus: 502, error: "SyntaxError" })),
    ).toBe(502);
  });

  it("explains a response that does not match the schema", () => {
    const result = failed({
      status: "CUSTOM_ERROR",
      error: "Response does not match the Portfolio schema",
      data: { httpStatus: 200, body: { id: 1 }, issues: [{ path: ["id"] }] },
    });

    expect(httpStatusOf(result)).toBe(200);
    expect(explainFailure("getPortfolio", result)).toMatch(/does not match the schema/);
  });
});
