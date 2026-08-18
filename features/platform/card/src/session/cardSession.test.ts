import { cardSession, getCardSessionToken, refreshCardSession } from "./cardSession";

describe("cardSession", () => {
  afterEach(() => {
    cardSession.clear();
  });

  it("starts empty", async () => {
    expect(cardSession.getToken()).toBeNull();
    await expect(getCardSessionToken()).resolves.toBeNull();
  });

  it("stores and reads the session token", async () => {
    cardSession.set("session-token");
    expect(cardSession.getToken()).toBe("session-token");
    await expect(getCardSessionToken()).resolves.toBe("session-token");
  });

  it("treats a nullish token as cleared", () => {
    cardSession.set("session-token");
    cardSession.set(undefined);
    expect(cardSession.getToken()).toBeNull();
  });

  it("clears the session", () => {
    cardSession.set("session-token");
    cardSession.clear();
    expect(cardSession.getToken()).toBeNull();
  });
});

describe("refreshCardSession", () => {
  afterEach(() => {
    cardSession.clear();
  });

  it("clears the session", async () => {
    cardSession.set("session-token");
    await expect(refreshCardSession()).resolves.toBeNull();
    expect(cardSession.getToken()).toBeNull();
  });
});
