import type { HttpHandler } from "msw";
import handlers from "./handler";
import { CARD_TOKEN_RESPONSES, createCardMockState, readCardMockState } from "./state";
import type { CardMockState, CardTokenResponseId } from "./state";

const TOKEN_URL = "https://card.test/v1/auth/oauth2/token";
const USER_URL = "https://card.test/v1/user";
const CARD_STATUS_URL = "https://card.test/v1/card/status";
const ONBOARDING_STATUS_URL = "https://card.test/v1/card/onboarding-status";

const MOCK_TOKEN = "Bearer at_mock_1";
const REAL_TOKEN = "Bearer at_from_baanx";

const PASSTHROUGH_STATUS = 302;

async function callHandler(url: string, init?: RequestInit): Promise<Response> {
  const request = new Request(url, init);
  for (const handler of handlers as HttpHandler[]) {
    const result = await handler.run({ request, requestId: "test-request" });
    if (result?.response) return result.response;
  }
  throw new Error(`no handler answered ${url}`);
}

function isPassthrough(response: Response): boolean {
  return (
    response.status === PASSTHROUGH_STATUS &&
    response.headers.get("x-msw-intention") === "passthrough"
  );
}

function refreshToken(body: Record<string, unknown> = { grant_type: "refresh_token" }) {
  return callHandler(TOKEN_URL, { method: "POST", body: JSON.stringify(body) });
}

function state(): CardMockState {
  const current = readCardMockState();
  if (!current) throw new Error("the handler did not install the mock state");
  return current;
}

function resetMockState(): void {
  const current = state();
  current.tokenResponse = "pass";
  current.userUnauthorizedOnce = false;
  current.refreshCount = 0;
}

function answerWith(id: CardTokenResponseId): void {
  state().tokenResponse = id;
}

beforeEach(() => {
  resetMockState();
});

describe("the Card mock state", () => {
  it("should install the state on the host, so the DevTool can read it", () => {
    expect(state()).toEqual({
      tokenResponse: "pass",
      responses: CARD_TOKEN_RESPONSES,
      userUnauthorizedOnce: false,
      refreshCount: 0,
    });
  });

  it("should install a fresh state, so a reload starts the mock over", () => {
    const installed = state();
    try {
      const created = createCardMockState();

      expect(readCardMockState()).toBe(created);
      expect(created).not.toBe(installed);
      expect(created.tokenResponse).toBe("pass");
    } finally {
      (globalThis as { payCardMockState?: CardMockState }).payCardMockState = installed;
    }
  });

  it("should offer every renewal answer with a label and a hint", () => {
    expect(CARD_TOKEN_RESPONSES.map(response => response.id)).toEqual([
      "pass",
      "200",
      "200-slow",
      "200-bad-body",
      "400",
      "422",
      "498",
      "499",
      "500",
      "network-error",
    ]);
    expect(CARD_TOKEN_RESPONSES.every(response => response.label && response.hint)).toBe(true);
  });
});

describe("the Card renewal mock", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("should stand aside on a request that is not a renewal", async () => {
    answerWith("200");

    const response = await refreshToken({ grant_type: "authorization_code" });

    expect(isPassthrough(response)).toBe(true);
    expect(state().refreshCount).toBe(0);
  });

  it("should stand aside on a body it cannot read", async () => {
    answerWith("200");

    const response = await callHandler(TOKEN_URL, { method: "POST", body: "not json" });

    expect(isPassthrough(response)).toBe(true);
  });

  it("should stand aside while it is off", async () => {
    answerWith("pass");

    const response = await refreshToken();

    expect(isPassthrough(response)).toBe(true);
    expect(state().refreshCount).toBe(0);
  });

  it("should stand aside on an answer it does not know", async () => {
    answerWith("made-up" as CardTokenResponseId);

    const response = await refreshToken();

    expect(isPassthrough(response)).toBe(true);
  });

  it("should rotate both tokens on a successful exchange", async () => {
    answerWith("200");

    const response = await refreshToken();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      access_token: "at_mock_1",
      refresh_token: "rt_mock_1",
      expires_in: 3600,
    });
  });

  it("should count each renewal, so the serial tells them apart", async () => {
    answerWith("200");

    await refreshToken();
    const second = await refreshToken();

    expect(state().refreshCount).toBe(2);
    await expect(second.json()).resolves.toMatchObject({
      access_token: "at_mock_2",
      refresh_token: "rt_mock_2",
    });
  });

  it("should answer a body with no refresh token, so the wire schema rejects it", async () => {
    answerWith("200-bad-body");

    const response = await refreshToken();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({ access_token: "at_mock_1", expires_in: 3600 });
    expect(body.refresh_token).toBeUndefined();
  });

  it("should hold a slow renewal open, so waiting callers share it", async () => {
    jest.useFakeTimers();
    answerWith("200-slow");

    const pending = refreshToken();
    await jest.advanceTimersByTimeAsync(5_000);
    const response = await pending;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ access_token: "at_mock_1" });
  });

  it("should answer an OAuth invalid_grant on 400", async () => {
    answerWith("400");

    const response = await refreshToken();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid_grant",
      error_description: "The refresh token is invalid, expired or revoked",
    });
  });

  it.each([
    ["422", 422, "x field is not allowed"],
    ["498", 498, "Invalid client key"],
    ["499", 499, "Missing client key"],
    ["500", 500, "Internal server error"],
  ] as const)("should answer %s with the provider's own message", async (id, status, message) => {
    answerWith(id);

    const response = await refreshToken();

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ message });
  });

  it("should answer nothing at all on a network failure", async () => {
    answerWith("network-error");

    const response = await refreshToken();

    expect(response.type).toBe("error");
  });
});

describe("the Card user mock", () => {
  it("should answer 401 once when the DevTool armed it", async () => {
    state().userUnauthorizedOnce = true;

    const response = await callHandler(USER_URL, { headers: { authorization: MOCK_TOKEN } });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "unauthorized" });
    expect(state().userUnauthorizedOnce).toBe(false);
  });

  it("should answer the mocked user on a mocked access token", async () => {
    const response = await callHandler(USER_URL, { headers: { authorization: MOCK_TOKEN } });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "6f1c9a52-3d4e-4b7a-9c81-2f0d5e7a1b34",
      verificationState: "VERIFIED",
    });
  });

  it("should stand aside on a real access token", async () => {
    const response = await callHandler(USER_URL, { headers: { authorization: REAL_TOKEN } });

    expect(isPassthrough(response)).toBe(true);
  });

  it("should stand aside on a request with no authorization at all", async () => {
    const response = await callHandler(USER_URL);

    expect(isPassthrough(response)).toBe(true);
  });
});

describe("the Card status mock", () => {
  it("should answer the mocked card on a mocked access token", async () => {
    const response = await callHandler(CARD_STATUS_URL, {
      headers: { authorization: MOCK_TOKEN },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      panLast4: "1234",
      status: "ACTIVE",
      type: "VIRTUAL",
    });
  });

  it("should stand aside on a real access token", async () => {
    const response = await callHandler(CARD_STATUS_URL, {
      headers: { authorization: REAL_TOKEN },
    });

    expect(isPassthrough(response)).toBe(true);
  });
});

describe("the Card onboarding status mock", () => {
  it("should answer the steps the DevTool toggles", async () => {
    const response = await callHandler(ONBOARDING_STATUS_URL);

    expect(response.status).toBe(200);
    const body = (await response.json()) as { steps: unknown[] };
    expect(Array.isArray(body.steps)).toBe(true);
  });
});
