import { cardSession, getCardSessionToken, getCardRefreshToken } from "./cardSession.web";

const session = { accessToken: "at_token", refreshToken: "rt_token" };

/** The wiring the desktop app gets: the same accessors, over the in-memory store. */
describe("cardSession.web", () => {
  afterEach(async () => {
    await cardSession.clear();
  });

  it("serves the access token to the base query once a session is stored", async () => {
    await expect(getCardSessionToken()).resolves.toBeNull();

    await cardSession.set(session);

    await expect(getCardSessionToken()).resolves.toBe("at_token");
    await expect(getCardRefreshToken()).resolves.toBe("rt_token");
    await expect(cardSession.get()).resolves.toMatchObject({
      accessToken: "at_token",
      refreshToken: "rt_token",
    });
  });

  it("stops serving the token once the session is cleared", async () => {
    await cardSession.set(session);

    await cardSession.clear();

    await expect(getCardSessionToken()).resolves.toBeNull();
    await expect(getCardRefreshToken()).resolves.toBeNull();
  });
});
