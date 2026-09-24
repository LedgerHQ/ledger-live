import { createFakeClock, createFetchMock, testConfig } from "../__mocks__/fetchMock";
import { BaanxHttpError, BaanxNoTokenError, BaanxOnboardingIncompleteError } from "../errors";
import type { FetchImpl } from "../types";
import { REDACTION_PLACEHOLDER } from "../http/body";
import { loginToBaanx } from "./login";
import { generateTotpCodeAt } from "./totp";

const AT_MS = 61_000;

describe("loginToBaanx", () => {
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

  it("should trim surrounding whitespace on the access token before building the session", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ exp: 1_700_000_000 })).toString("base64url");
    const jwt = `${header}.${payload}.sig`;
    const { fetchImpl } = createFetchMock([{ body: { accessToken: ` ${jwt} ` } }]);

    const session = await loginToBaanx(testConfig(), { fetchImpl });

    expect(session.accessToken).toBe(jwt);
    expect(session.expirySource).toBe("token");
  });

  it("triggers the challenge, derives the code and retries the login", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1", phoneNumber: "+445*****225" } },
      { body: { success: true } },
      { body: { accessToken: "token-after-otp", userId: "user-1" } },
    ]);

    const session = await loginToBaanx(testConfig(), {
      fetchImpl,
      clock: createFakeClock(AT_MS).clock,
    });

    expect(session.accessToken).toBe("token-after-otp");
    expect(session.otpUsed).toBe(true);
    expect(requests.map(request => request.path)).toEqual([
      "/v1/auth/login",
      "/v1/auth/login/otp",
      "/v1/auth/login",
    ]);
    expect(requests[1].body).toEqual({ userId: "user-1" });
    expect(requests[2].body).toEqual({
      email: "tester@ledger.test",
      password: "correct horse battery staple",
      otpCode: generateTotpCodeAt(testConfig().totp, AT_MS),
    });
    expect(requests[2].body).not.toHaveProperty("phoneNumber");
  });

  it("should redact config secrets echoed in phase on BaanxOnboardingIncompleteError", async () => {
    const config = testConfig();
    const { fetchImpl } = createFetchMock([
      { body: { phase: `ACCOUNT ${config.password} ${config.clientKey}` } },
    ]);

    const error = await loginToBaanx(config, { fetchImpl }).catch((rejected: unknown) => rejected);

    expect(error).toBeInstanceOf(BaanxOnboardingIncompleteError);
    expect((error as BaanxOnboardingIncompleteError).phase).toBe(
      `ACCOUNT ${REDACTION_PLACEHOLDER} ${REDACTION_PLACEHOLDER}`,
    );
    expect((error as BaanxOnboardingIncompleteError).message).not.toContain(config.password);
    expect((error as BaanxOnboardingIncompleteError).message).not.toContain(config.clientKey);
  });

  it("should redact the generated OTP echoed in phase after the OTP retry", async () => {
    const config = testConfig();
    const code = generateTotpCodeAt(config.totp, AT_MS);
    const { fetchImpl } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1" } },
      { body: { success: true } },
      { body: { phase: `PHONE_NUMBER ${code}` } },
    ]);

    const error = await loginToBaanx(config, {
      fetchImpl,
      clock: createFakeClock(AT_MS).clock,
    }).catch((rejected: unknown) => rejected);

    expect(error).toBeInstanceOf(BaanxOnboardingIncompleteError);
    expect((error as BaanxOnboardingIncompleteError).phase).toBe(
      `PHONE_NUMBER ${REDACTION_PLACEHOLDER}`,
    );
    expect((error as BaanxOnboardingIncompleteError).message).not.toContain(code);
  });

  it("should redact the generated OTP on BaanxNoTokenError when a 200 body echoes it in an unknown field", async () => {
    const config = testConfig();
    const code = generateTotpCodeAt(config.totp, AT_MS);
    const { fetchImpl } = createFetchMock([
      { body: { isOtpRequired: true, userId: "user-1" } },
      { body: { success: true } },
      { body: { detail: `rejected ${code}` } },
    ]);

    const error = await loginToBaanx(config, {
      fetchImpl,
      clock: createFakeClock(AT_MS).clock,
    }).catch((rejected: unknown) => rejected);

    expect(error).toBeInstanceOf(BaanxNoTokenError);
    expect((error as BaanxNoTokenError).body).toEqual({
      detail: `rejected ${REDACTION_PLACEHOLDER}`,
    });
    expect(JSON.stringify((error as BaanxNoTokenError).body)).not.toContain(code);
  });

  it("should not leak a client key that straddles the non-JSON excerpt limit", async () => {
    const config = testConfig();
    const raw = `${"x".repeat(1_999)}${config.clientKey}`;
    const fetchImpl = (async () => new Response(raw, { status: 502 })) as unknown as FetchImpl;

    const error = await loginToBaanx(config, { fetchImpl }).catch((rejected: unknown) => rejected);

    expect(error).toBeInstanceOf(BaanxHttpError);
    expect(JSON.stringify((error as BaanxHttpError).body)).not.toContain(config.clientKey);
  });
});
