import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { toPortfolioApiError } from "./errors";

describe("toPortfolioApiError", () => {
  it("maps the error body of the service", async () => {
    const response = Response.json(
      {
        status: 500,
        type: "INTERNAL_ERROR",
        message: "An internal server occurred",
        details: "Could not establish a connection to the database",
      },
      { status: 500 },
    );

    const error = await toPortfolioApiError(response);

    expect(error).toBeInstanceOf(PortfolioApiError);
    expect(error).toMatchObject({
      type: "INTERNAL_ERROR",
      status: 500,
      message: "An internal server occurred",
      details: "Could not establish a connection to the database",
    });
  });

  it("keeps the type of the body over the one of the status", async () => {
    const response = Response.json({ type: "UNAVAILABLE", message: "down" }, { status: 500 });

    expect(await toPortfolioApiError(response)).toMatchObject({ type: "UNAVAILABLE", status: 503 });
  });

  it.each([
    [400, "BAD_REQUEST"],
    [404, "NOT_FOUND"],
    [405, "METHOD_NOT_ALLOWED"],
    [429, "TOO_MANY_REQUESTS"],
    [503, "UNAVAILABLE"],
    [500, "INTERNAL_ERROR"],
    [502, "INTERNAL_ERROR"],
    [418, "INTERNAL_ERROR"],
  ])("derives the type of a %i without a known body type from its status", async (status, type) => {
    const response = Response.json({ type: "TEAPOT", message: "nope" }, { status });

    expect(await toPortfolioApiError(response)).toMatchObject({ type });
  });

  it("falls back on the status text when the body has no message", async () => {
    const response = Response.json({ message: "" }, { status: 404, statusText: "Not Found" });

    expect(await toPortfolioApiError(response)).toMatchObject({ message: "Not Found" });
  });

  it("falls back on a generic message without a message nor a status text", async () => {
    const response = new Response(null, { status: 502 });

    expect(await toPortfolioApiError(response)).toMatchObject({
      type: "INTERNAL_ERROR",
      message: "Portfolio service answered 502",
    });
  });

  it("ignores details that are not a string", async () => {
    const response = Response.json({ message: "bad", details: { field: "size" } }, { status: 400 });

    expect(await toPortfolioApiError(response)).toMatchObject({ details: undefined });
  });

  it("maps a body that is not JSON from the status", async () => {
    const response = new Response("<html>Bad gateway</html>", {
      status: 503,
      statusText: "Service Unavailable",
    });

    expect(await toPortfolioApiError(response)).toMatchObject({
      type: "UNAVAILABLE",
      message: "Service Unavailable",
      details: undefined,
    });
  });

  it.each([["null"], ['"oops"'], ["42"]])(
    "maps a JSON body that is not an object (%s) from the status",
    async body => {
      const response = new Response(body, { status: 429, statusText: "Too Many Requests" });

      expect(await toPortfolioApiError(response)).toMatchObject({
        type: "TOO_MANY_REQUESTS",
        message: "Too Many Requests",
      });
    },
  );
});
