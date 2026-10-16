import { PortfolioApiError, isPortfolioApiError } from "./errors";

describe("PortfolioApiError", () => {
  it.each([
    ["BAD_REQUEST", 400],
    ["NOT_FOUND", 404],
    ["METHOD_NOT_ALLOWED", 405],
    ["TOO_MANY_REQUESTS", 429],
    ["INTERNAL_ERROR", 500],
    ["UNAVAILABLE", 503],
  ] as const)("answers %s with the status of the service", (type, status) => {
    expect(new PortfolioApiError(type, "message", "details")).toMatchObject({
      name: "PortfolioApiError",
      type,
      status,
      message: "message",
      details: "details",
    });
  });

  it("is recognized among other errors", () => {
    expect(isPortfolioApiError(new PortfolioApiError("NOT_FOUND", "gone"))).toBe(true);
    expect(isPortfolioApiError(new Error("gone"))).toBe(false);
    expect(new PortfolioApiError("NOT_FOUND", "gone").details).toBeUndefined();
  });
});
