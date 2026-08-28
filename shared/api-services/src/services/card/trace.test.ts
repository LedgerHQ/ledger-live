import { traceCard, traceCardApiAnswer } from "./trace";

const NODE_ENV = process.env.NODE_ENV;

/** The trace reads `NODE_ENV` at call time, so each case states the build it runs in. */
function inBuild(env: string | undefined, run: () => void): void {
  process.env.NODE_ENV = env;
  try {
    run();
  } finally {
    process.env.NODE_ENV = NODE_ENV;
  }
}

describe("the Card trace", () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockRestore();
  });

  /** The only line that decides whether any of this reaches a user's device. */
  it.each(["production", "test", undefined])("says nothing in a %s build", env => {
    inBuild(env, () => {
      traceCard("renewal", "400 invalid_grant");
      traceCardApiAnswer({
        method: "POST",
        url: "/v1/auth/oauth2/token",
        responseStatus: undefined,
        error: { status: 400, data: { error: "invalid_grant" } },
      });
    });

    expect(log).not.toHaveBeenCalled();
  });

  it("names the scope, so two sources never read as one", () => {
    inBuild("development", () => traceCard("renewal", "400 invalid_grant"));

    expect(log).toHaveBeenCalledWith("[card renewal] 400 invalid_grant");
  });

  it("prints the status of an answer that succeeded, and no body", () => {
    inBuild("development", () =>
      traceCardApiAnswer({
        method: "POST",
        url: "https://card/v1/auth/oauth2/token",
        responseStatus: 200,
        error: undefined,
      }),
    );

    expect(log).toHaveBeenCalledWith("[card api] POST https://card/v1/auth/oauth2/token → 200");
  });

  it("prints the body of a failure, which nothing else records", () => {
    inBuild("development", () =>
      traceCardApiAnswer({
        method: "POST",
        url: "/v1/auth/oauth2/token",
        responseStatus: undefined,
        error: { status: 400, data: { error: "invalid_grant", error_description: "expired" } },
      }),
    );

    expect(log).toHaveBeenCalledWith(
      '[card api] POST /v1/auth/oauth2/token → 400 {"error":"invalid_grant","error_description":"expired"}',
    );
  });

  it("replaces every field that can hold a credential", () => {
    inBuild("development", () =>
      traceCardApiAnswer({
        method: "POST",
        url: "/v1/auth/oauth2/token",
        responseStatus: undefined,
        error: {
          status: 400,
          data: {
            error: "invalid_grant",
            refresh_token: "leaked-rt",
            access_token: "leaked-at",
            id_token: "leaked-id",
            code: "leaked-code",
            client_secret: "leaked-cs",
            Authorization: "Bearer leaked-at",
            nested: { provider_token: "leaked-np" },
          },
        },
      }),
    );

    const [line] = log.mock.calls[0] as [string];
    // The key names survive, so a reader still sees which fields the provider sent back.
    expect(line).toContain('"error":"invalid_grant"');
    expect(line).toContain('"client_secret":"[redacted]"');
    expect(line).not.toContain("leaked");
  });

  it("reads the message of a transport failure, which carries no body", () => {
    inBuild("development", () =>
      traceCardApiAnswer({
        method: "POST",
        url: "/v1/auth/oauth2/token",
        responseStatus: undefined,
        error: { status: "FETCH_ERROR", error: "network down" },
      }),
    );

    expect(log).toHaveBeenCalledWith(
      '[card api] POST /v1/auth/oauth2/token → FETCH_ERROR "network down"',
    );
  });

  it("caps a long string, so one answer stays one line", () => {
    inBuild("development", () =>
      traceCardApiAnswer({
        method: "GET",
        url: "/v1/user",
        responseStatus: undefined,
        error: { status: 500, data: { message: "x".repeat(400) } },
      }),
    );

    const [line] = log.mock.calls[0] as [string];
    expect(line).toContain("…");
    expect(line.length).toBeLessThan(300);
  });
});
