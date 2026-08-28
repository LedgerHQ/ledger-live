import {
  cardSession,
  getCardSessionToken,
  getCardRefreshToken,
  readCardSession,
} from "./cardSession.native";

/**
 * A keychain of one entry per `service`, which is how the native store uses the library. It keeps
 * this test about the wiring, not about the option each call passes — `secureStore.native.test.ts`
 * covers that.
 */
jest.mock("react-native-keychain", () => {
  const entries = new Map<string, string>();
  return {
    ACCESSIBLE: { AFTER_FIRST_UNLOCK: "AccessibleAfterFirstUnlock" },
    STORAGE_TYPE: { AES_GCM_NO_AUTH: "KeystoreAESGCM_NoAuth" },
    getGenericPassword: jest.fn(async ({ service }: { service: string }) => {
      const password = entries.get(service);
      return password === undefined ? false : { username: "payCard", password };
    }),
    setGenericPassword: jest.fn(
      async (_username: string, password: string, { service }: { service: string }) => {
        entries.set(service, password);
        return { service, storage: "KeystoreAESGCM_NoAuth" };
      },
    ),
    resetGenericPassword: jest.fn(async ({ service }: { service: string }) =>
      entries.delete(service),
    ),
  };
});

const session = { accessToken: "at_token", refreshToken: "rt_token" };

/** The wiring the mobile app gets: the same accessors, over the keychain store. */
describe("cardSession.native", () => {
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

  it("serves the base query the token and the epoch of the session it came from", async () => {
    await cardSession.set(session);

    await expect(readCardSession()).resolves.toEqual({
      token: "at_token",
      epoch: expect.any(Number),
    });
  });
});
