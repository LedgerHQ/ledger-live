import { server } from "@tests/server";
import handlers from "./handler";
import { readCardMockState, type CardTokenResponseId } from "./state";

const TOKEN_URL = "https://card.test/v1/auth/oauth2/token";

function renew(response: CardTokenResponseId) {
  const state = readCardMockState();
  if (!state) throw new Error("Card mock state was not initialized");
  state.tokenResponse = response;
  return fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token" }),
  });
}

describe("Card renewal mock handlers", () => {
  beforeEach(() => {
    const state = readCardMockState();
    if (!state) throw new Error("Card mock state was not initialized");
    state.tokenResponse = "pass";
    state.userUnauthorizedOnce = false;
    state.refreshCount = 0;
    server.use(...handlers);
  });

  it.each([
    ["200", 200],
    ["200-bad-body", 200],
    ["400", 400],
    ["422", 422],
    ["498", 498],
    ["499", 499],
    ["500", 500],
  ] as const)("answers the %s renewal mode", async (mode, status) => {
    const response = await renew(mode);

    expect(response.status).toBe(status);
    expect(readCardMockState()?.refreshCount).toBe(1);
  });

  it("returns rotated tokens for a successful renewal", async () => {
    const response = await renew("200");

    await expect(response.json()).resolves.toEqual({
      access_token: "at_mock_1",
      refresh_token: "rt_mock_1",
      expires_in: 3600,
    });
  });

  it("simulates a renewal network failure", async () => {
    await expect(renew("network-error")).rejects.toBeDefined();
    expect(readCardMockState()?.refreshCount).toBe(1);
  });

  it("passes through requests the mock does not own", async () => {
    await expect(renew("pass")).rejects.toBeDefined();
    await expect(
      fetch(TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grant_type: "authorization_code" }),
      }),
    ).rejects.toBeDefined();
    await expect(fetch("https://card.test/v1/user")).rejects.toBeDefined();
    await expect(fetch("https://card.test/v1/card/status")).rejects.toBeDefined();
  });

  it("arms one unauthorized user response", async () => {
    const state = readCardMockState();
    if (!state) throw new Error("Card mock state was not initialized");
    state.userUnauthorizedOnce = true;

    const response = await fetch("https://card.test/v1/user");

    expect(response.status).toBe(401);
    expect(state.userUnauthorizedOnce).toBe(false);
  });

  it("answers user and card reads for mock access tokens", async () => {
    const headers = { authorization: "Bearer at_mock_1" };

    const [user, card] = await Promise.all([
      fetch("https://card.test/v1/user", { headers }),
      fetch("https://card.test/v1/card/status", { headers }),
    ]);

    await expect(user.json()).resolves.toMatchObject({
      id: expect.any(String),
      verificationState: "VERIFIED",
    });
    await expect(card.json()).resolves.toMatchObject({
      holderName: "JOHN DOE",
      status: "ACTIVE",
    });
  });
});
