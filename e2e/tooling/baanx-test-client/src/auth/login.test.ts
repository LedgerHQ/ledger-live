import {
  createFakeClock,
  createFetchMock,
  jwtWithExpiry,
  RFC6238_SECRET,
  testConfig,
} from "../__mocks__/fetchMock";
import { REDACTION_PLACEHOLDER } from "../http/body";
import {
  BaanxHttpError,
  BaanxInvalidClientKeyError,
  BaanxInvalidCredentialsError,
  BaanxMissingClientKeyError,
  BaanxNoTokenError,
  BaanxOnboardingIncompleteError,
  BaanxOtpError,
  BaanxRateLimitError,
  BaanxTransportError,
} from "../errors";
import { loginToBaanx } from "./login";
import { generateTotpCodeAt } from "./totp";
import { ASSUMED_TOKEN_LIFETIME_MS } from "../types";

/**
 * Baanx answers 200 even when login has not completed, so these tests pin the
 * *body* for each branch and assert we never read success out of a status code.
 */

const AT_MS = 61_000;

/** A fake clock parked mid-window, so the derived code is deterministic. */
function fixedClock() {
  return createFakeClock(AT_MS).clock;
}

describe("loginToBaanx — success", () => {
  it("returns a session when the first response carries a token", async () => {
    const { fetchImpl, requests } = createFetchMock([
      {
        body: {
          accessToken: "token-abc",
          userId: "user-1",
          isOtpRequired: false,
          phase: null,
          verificationState: "VERIFIED",
          isLinked: true,
        },
      },
    ]);

    const session = await loginToBaanx(testConfig(), { fetchImpl });

    expect(session).toMatchObject({
      accessToken: "token-abc",
      userId: "user-1",
      otpUsed: false,
      verificationState: "VERIFIED",
      isLinked: true,
      region: "international",
      email: "tester@ledger.test",
      baseUrl: "https://dev.api.baanx.test",
    });
    expect(requests).toHaveLength(1);
    expect(requests[0].path).toBe("/v1/auth/login");
    expect(requests[0].body).toEqual({
      email: "tester@ledger.test",
      password: "correct horse battery staple",
    });
  });

  it("sends the client key and content type, but not x-us-env by default", async () => {
    const { fetchImpl, requests } = createFetchMock([{ body: { accessToken: "t" } }]);

    await loginToBaanx(testConfig(), { fetchImpl });

    expect(requests[0].headers).toEqual({
      "Content-Type": "application/json",
      "x-client-key": "test-client-key",
    });
  });

  it("sends x-us-env for US-region users", async () => {
    const { fetchImpl, requests } = createFetchMock([{ body: { accessToken: "t" } }]);

    await loginToBaanx(testConfig({ region: "us" }), { fetchImpl });

    expect(requests[0].headers["x-us-env"]).toBe("true");
  });

  it("prefers the JWT exp over the assumed lifetime", async () => {
    const expSeconds = 4_000_000_000;
    const { fetchImpl } = createFetchMock([{ body: { accessToken: jwtWithExpiry(expSeconds) } }]);

    const session = await loginToBaanx(testConfig(), { fetchImpl });

    expect(session.expirySource).toBe("token");
    expect(session.expiresAt).toBe(new Date(expSeconds * 1_000).toISOString());
  });

  it("falls back to the documented 6-hour lifetime for an opaque token", async () => {
    const { fetchImpl } = createFetchMock([{ body: { accessToken: "opaque-token" } }]);

    const session = await loginToBaanx(testConfig(), { fetchImpl });

    expect(session.expirySource).toBe("assumed");
    expect(Date.parse(session.expiresAt) - Date.parse(session.issuedAt)).toBe(
      ASSUMED_TOKEN_LIFETIME_MS,
    );
  });
});

describe("loginToBaanx — onboarding incomplete", () => {
  it.each([
    "ACCOUNT",
    "PHONE_NUMBER",
    "PERSONAL_INFORMATION",
    "PHYSICAL_ADDRESS",
    "MAILING_ADDRESS",
  ])("throws naming the phase for %s", async phase => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { phase, userId: "user-1", accessToken: null } },
    ]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error).toBeInstanceOf(BaanxOnboardingIncompleteError);
    expect((error as BaanxOnboardingIncompleteError).phase).toBe(phase);
    expect((error as BaanxOnboardingIncompleteError).userId).toBe("user-1");
    expect(error.message).toContain(phase);
    // No token will ever come, so we must not try the OTP dance.
    expect(requests).toHaveLength(1);
  });

  it("takes the phase branch even when isOtpRequired is also set", async () => {
    const { fetchImpl } = createFetchMock([
      { body: { phase: "PHONE_NUMBER", isOtpRequired: true, userId: "user-1" } },
    ]);

    await expect(loginToBaanx(testConfig(), { fetchImpl })).rejects.toBeInstanceOf(
      BaanxOnboardingIncompleteError,
    );
  });
});

describe("loginToBaanx — OTP required", () => {
  it("triggers the challenge, derives the code and retries the login", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1", phoneNumber: "+445*****225" } },
      { body: { success: true } },
      { body: { accessToken: "token-after-otp", userId: "user-1" } },
    ]);

    const session = await loginToBaanx(testConfig(), { fetchImpl, clock: fixedClock() });

    expect(session.accessToken).toBe("token-after-otp");
    expect(session.otpUsed).toBe(true);

    expect(requests.map(request => request.path)).toEqual([
      "/v1/auth/login",
      "/v1/auth/login/otp",
      "/v1/auth/login",
    ]);

    // The trigger call takes only the userId.
    expect(requests[1].body).toEqual({ userId: "user-1" });

    // The retry carries the code and no phoneNumber.
    expect(requests[2].body).toEqual({
      email: "tester@ledger.test",
      password: "correct horse battery staple",
      otpCode: generateTotpCodeAt(testConfig().totp, AT_MS),
    });
    expect(requests[2].body).not.toHaveProperty("phoneNumber");
  });

  it("waits for the next TOTP window before submitting a code about to expire", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1" } },
      { body: { success: true } },
      { body: { accessToken: "token-after-otp" } },
    ]);
    // 1s left in the window.
    const { clock, sleeps } = createFakeClock(89_000);

    await loginToBaanx(testConfig(), { fetchImpl, clock });

    expect(sleeps).toEqual([1_000]);
    expect(requests[2].body.otpCode).toBe(generateTotpCodeAt(testConfig().totp, 90_000));
  });

  it("fails when Baanx asks for an OTP without returning a userId", async () => {
    const { fetchImpl, requests } = createFetchMock([{ body: { isOtpRequired: true } }]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error).toBeInstanceOf(BaanxOtpError);
    expect(error.message).toContain("no userId");
    expect(requests).toHaveLength(1);
  });

  it("stops instead of looping when the code is rejected", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1" } },
      { body: { success: true } },
      // Challenged again: the code was not accepted.
      { body: { isOtpRequired: true, userId: "user-1" } },
    ]);

    const error = await captureError(
      loginToBaanx(testConfig(), { fetchImpl, clock: fixedClock() }),
    );

    expect(error).toBeInstanceOf(BaanxOtpError);
    expect(error.message).toContain("BAANX_TEST_USER_TOTP_SECRET");
    // Exactly three calls: no retry storm that could lock the account.
    expect(requests).toHaveLength(3);
  });

  it("explains a failing trigger call in terms of the authenticator setup", async () => {
    const { fetchImpl } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1" } },
      { status: 400, body: { message: "user has no phone number" } },
    ]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error).toBeInstanceOf(BaanxOtpError);
    expect(error.message).toContain("/v1/auth/login/otp");
    expect(error.message).toContain("authenticator-only");
    expect(error.message).toContain("user has no phone number");
  });

  it.each([
    ["rate limit (429)", 429, BaanxRateLimitError],
    ["rejected client key (498)", 498, BaanxInvalidClientKeyError],
    ["bad credentials (401)", 401, BaanxInvalidCredentialsError],
  ] as const)(
    "lets a %s on the trigger surface as its own typed error",
    async (_label, status, expected) => {
      const { fetchImpl } = createFetchMock([
        { body: { isOtpRequired: true, userId: "user-1" } },
        { status, body: { message: "Too many requests, please try again later." } },
      ]);

      const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

      // Observed live: a 429 here used to be reported as a possible
      // authenticator-provisioning problem, hiding the real cause.
      expect(error).toBeInstanceOf(expected);
      expect(error).not.toBeInstanceOf(BaanxOtpError);
      expect(error.message).not.toContain("authenticator-only");
    },
  );

  it("keeps Retry-After reachable when the trigger is rate limited", async () => {
    const { fetchImpl } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1" } },
      { status: 429, body: { message: "Too many requests" }, headers: { "retry-after": "60" } },
    ]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect((error as BaanxRateLimitError).retryAfter).toBe("60");
  });

  it("scrubs the generated OTP code if the API echoes it back", async () => {
    // The package promises generated codes never reach an error. The retry is
    // the only request that carries one, so it is the only place it can leak.
    const code = generateTotpCodeAt(testConfig().totp, AT_MS);
    const { fetchImpl } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1" } },
      { body: { success: true } },
      { status: 400, body: { message: `otpCode ${code} was rejected` } },
    ]);

    const error = await captureError(
      loginToBaanx(testConfig(), { fetchImpl, clock: fixedClock() }),
    );

    expect(error.message).not.toContain(code);
    expect(JSON.stringify((error as BaanxHttpError).body ?? "")).not.toContain(code);
  });

  it("reports an onboarding phase that only appears on the retry", async () => {
    const { fetchImpl } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1" } },
      { body: { success: true } },
      { body: { phase: "PERSONAL_INFORMATION", userId: "user-1" } },
    ]);

    const error = await captureError(
      loginToBaanx(testConfig(), { fetchImpl, clock: fixedClock() }),
    );

    expect(error).toBeInstanceOf(BaanxOnboardingIncompleteError);
    expect((error as BaanxOnboardingIncompleteError).phase).toBe("PERSONAL_INFORMATION");
  });
});

describe("loginToBaanx — 200 with no token and no reason", () => {
  it.each([
    ["accessToken is null", { accessToken: null, isOtpRequired: false, phase: null }],
    ["accessToken is missing", { userId: "user-1" }],
    ["accessToken is an empty string", { accessToken: "" }],
    ["accessToken is whitespace", { accessToken: "   " }],
    ["the body is not an object", "unexpected"],
    ["the body is empty", undefined],
  ])("throws rather than producing `Bearer null` when %s", async (_label, body) => {
    const { fetchImpl } = createFetchMock([{ body }]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error).toBeInstanceOf(BaanxNoTokenError);
  });

  it.each(["null", "undefined", "NULL", " null ", "none", "0", "false"])(
    "rejects the string sentinel %p rather than sending it as a Bearer token",
    async token => {
      const { fetchImpl } = createFetchMock([{ body: { accessToken: token } }]);

      await expect(loginToBaanx(testConfig(), { fetchImpl })).rejects.toBeInstanceOf(
        BaanxNoTokenError,
      );
    },
  );

  it("still accepts a legitimate token that merely contains a sentinel word", async () => {
    const { fetchImpl } = createFetchMock([{ body: { accessToken: "null-ish-but-real-token" } }]);

    const session = await loginToBaanx(testConfig(), { fetchImpl });

    expect(session.accessToken).toBe("null-ish-but-real-token");
  });

  it("attaches the raw body with credentials redacted", async () => {
    const { fetchImpl } = createFetchMock([
      {
        body: {
          accessToken: null,
          password: "hunter2",
          nested: { clientKey: "abc" },
          note: "keep",
        },
      },
    ]);

    const error = (await captureError(
      loginToBaanx(testConfig(), { fetchImpl }),
    )) as BaanxNoTokenError;

    expect(error.body).toEqual({
      accessToken: REDACTION_PLACEHOLDER,
      password: REDACTION_PLACEHOLDER,
      nested: { clientKey: REDACTION_PLACEHOLDER },
      note: "keep",
    });
    expect(JSON.stringify(error.body)).not.toContain("hunter2");
  });

  it("keeps a non-JSON body as a bounded excerpt", async () => {
    const fetchImpl = (async () =>
      new Response("<html>gateway error</html>", { status: 200 })) as unknown as typeof fetch;

    const error = (await captureError(
      loginToBaanx(testConfig(), { fetchImpl }),
    )) as BaanxNoTokenError;

    expect(error.body).toEqual({ nonJsonBody: "<html>gateway error</html>" });
  });
});

describe("loginToBaanx — mapped HTTP failures", () => {
  it("maps 498 to an invalid-client-key error naming the env var", async () => {
    const { fetchImpl } = createFetchMock([{ status: 498, body: { message: "Invalid Token" } }]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error).toBeInstanceOf(BaanxInvalidClientKeyError);
    expect(error.message).toContain("Invalid Token");
    expect(error.message).toContain("BAANX_CLIENT_KEY");
    // The key itself must not be echoed.
    expect(error.message).not.toContain("test-client-key");
  });

  it("maps 499 to a missing-client-key error naming the env var", async () => {
    const { fetchImpl } = createFetchMock([{ status: 499, body: { message: "Token Required" } }]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error).toBeInstanceOf(BaanxMissingClientKeyError);
    expect(error.message).toContain("Token Required");
    expect(error.message).toContain("BAANX_CLIENT_KEY");
  });

  it("maps 401 to invalid credentials", async () => {
    const { fetchImpl } = createFetchMock([
      { status: 401, body: { message: "Incorrect email or password" } },
    ]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error).toBeInstanceOf(BaanxInvalidCredentialsError);
    expect((error as BaanxInvalidCredentialsError).accountLocked).toBe(false);
    expect(error.message).toContain("Incorrect email or password");
    expect(error.message).not.toContain("correct horse battery staple");
  });

  it.each(["Account locked", "Too many failed attempts", "This account is temporarily disabled"])(
    "detects the account-locked message %p on a 401",
    async message => {
      const { fetchImpl } = createFetchMock([{ status: 401, body: { message } }]);

      const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

      expect((error as BaanxInvalidCredentialsError).accountLocked).toBe(true);
      expect(error.message).toContain(message);
    },
  );

  it("maps 429 and includes Retry-After", async () => {
    const { fetchImpl } = createFetchMock([
      { status: 429, body: { message: "Too many requests" }, headers: { "retry-after": "120" } },
    ]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error).toBeInstanceOf(BaanxRateLimitError);
    expect((error as BaanxRateLimitError).retryAfter).toBe("120");
    expect(error.message).toContain("Retry-After: 120");
  });

  it("says so explicitly when a 429 carries no Retry-After", async () => {
    const { fetchImpl } = createFetchMock([{ status: 429, body: {} }]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect((error as BaanxRateLimitError).retryAfter).toBeNull();
    expect(error.message).toContain("No Retry-After header");
  });

  it("maps any other status to a generic HTTP error keeping the API message", async () => {
    const { fetchImpl } = createFetchMock([
      { status: 503, body: { error: "upstream unavailable" } },
    ]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error).toBeInstanceOf(BaanxHttpError);
    expect((error as BaanxHttpError).status).toBe(503);
    expect(error.message).toBe("upstream unavailable");
  });

  it("reports a status with no message rather than swallowing it", async () => {
    const { fetchImpl } = createFetchMock([{ status: 500, body: {} }]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error.message).toContain("HTTP 500");
  });

  it.each([
    ["the client key", "test-client-key"],
    ["the password", "correct horse battery staple"],
    ["the TOTP secret", RFC6238_SECRET],
  ])("scrubs %s if the API echoes it back in a message", async (_label, secret) => {
    // A gateway that reflects a submitted value would otherwise put it
    // straight into the error message, which redacting the body does not cover.
    const { fetchImpl } = createFetchMock([
      { status: 400, body: { message: `Rejected value ${secret} for this request` } },
    ]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error.message).not.toContain(secret);
    expect(error.message).toContain("[redacted]");
  });

  it("surfaces a transport failure without echoing the request", async () => {
    const { fetchImpl } = createFetchMock([{ throws: "ECONNREFUSED" }]);

    const error = await captureError(loginToBaanx(testConfig(), { fetchImpl }));

    expect(error).toBeInstanceOf(BaanxTransportError);
    expect(error.message).toContain("https://dev.api.baanx.test");
    expect(error.message).toContain("ECONNREFUSED");
    expect(error.message).not.toContain("correct horse battery staple");
  });

  it("maps a failure on the OTP retry, not just the first call", async () => {
    const { fetchImpl } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1" } },
      { body: { success: true } },
      { status: 401, body: { message: "Invalid OTP code" } },
    ]);

    const error = await captureError(
      loginToBaanx(testConfig(), { fetchImpl, clock: fixedClock() }),
    );

    expect(error).toBeInstanceOf(BaanxInvalidCredentialsError);
    expect(error.message).toContain("Invalid OTP code");
  });
});

/** Await a rejection and hand back the error, so assertions can inspect it. */
async function captureError(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }

  throw new Error("expected the promise to reject, but it resolved");
}
