import { configureStore } from "@reduxjs/toolkit";
import {
  cardApi,
  cardApiExtra,
  CARD_GRANT_ENDPOINTS,
  type CardApiExtra,
} from "@shared/api-services";
import * as apiModule from "./api";
import {
  cardManagementApi,
  initiatePayCardLogout,
  useFreezeCardMutation,
  useGetCardLinkedWalletsQuery,
  useGetCardOnboardingStatusQuery,
  useCreateCardDetailsTokenMutation,
  useGetCardStatusQuery,
  useLazyGetCardStatusQuery,
  useGetInternalWalletsQuery,
  useOrderCardMutation,
  useUnfreezeCardMutation,
} from "./api";
import {
  CARD_API_BASE_URL,
  deferred,
  errorResponse,
  flushPendingRequests,
  jsonResponse,
  mockCardProvider,
} from "./cardProvider.mock";

const provider = mockCardProvider();

const cardStatus = {
  id: "000000000050277836",
  holderName: "JOHN DOE",
  expiryDate: "2028/01",
  panLast4: "1234",
  status: "ACTIVE",
  type: "VIRTUAL",
  orderedAt: "2023-03-27T17:07:12.662Z",
};

const internalWalletsOnTheWire = [
  {
    id: "098aeb90-e7f7-4f81-bc2e-4963330122c5",
    balance: "125.50",
    currency: "xrp",
    address: "rNxp4h8apvRis6mJf9Sh8C6iRxfrDWN7AA",
    addressMemo: "78",
    addressId: "0x0a4b21fa733e9aeaddbf070302a85c559de13c4c",
    type: "INTERNAL",
  },
  {
    id: "7c1839ee-918e-4787-b74f-deeb48ead58b",
    balance: "500.00",
    currency: "usdc",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
    addressMemo: null,
    addressId: "7c1839ee-918e-4787-b74f-deeb48ead58b",
    type: "INTERNAL",
  },
];

const internalWallets = internalWalletsOnTheWire.map(
  ({ addressId: _addressId, type: _type, ...wallet }) => wallet,
);

const linkedWallets = [
  {
    id: "1693a6da-5945-4461-ba1c-0b9891f78848",
    address: "DfKNsYfrCEHb7ScJkuMTtPTeDiyjmBBm9NMHnbR7uFHz",
    currency: "sol",
    network: "solana",
    priority: 1,
  },
  {
    id: "7c1839ee-918e-4787-b74f-deeb48ead58b",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
    currency: "usdc",
    network: "ethereum",
    priority: 2,
  },
];

const makeStore = (sessionToken: string | null = null, overrides: Partial<CardApiExtra> = {}) =>
  configureStore({
    reducer: {
      [cardManagementApi.reducerPath]: cardManagementApi.reducer,
    },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: cardApiExtra({
            getCardApiBaseUrl: () => CARD_API_BASE_URL,
            getCardBaanxClientKey: () => "client-key",
            readCardSession: () => Promise.resolve({ token: sessionToken, sessionId: 1 }),
            isCardSessionCurrent: () => true,
            refreshCardSession: () => Promise.resolve({ kind: "session-replaced" as const }),
            ...overrides,
          }),
        },
      }).concat(cardApi.middleware),
  });

function expectSessionRequest(method: "GET" | "POST", path: string) {
  const sent = provider.sent();

  expect(sent.method).toBe(method);
  expect(sent.url).toBe(`${CARD_API_BASE_URL}${path}`);
  expect(sent.headers.get("authorization")).toBe("Bearer session-token");
  expect(sent.headers.get("x-client-key")).toBe("client-key");
}

describe("cardManagementApi configuration", () => {
  it("is the shared cardApi, injected in place", () => {
    expect(cardManagementApi).toBe(cardApi);
    expect(cardManagementApi.reducerPath).toBe("cardApi");
  });

  it("injects exactly its own endpoints", () => {
    expect(Object.keys(cardManagementApi.endpoints).sort()).toEqual([
      "createCardDetailsToken",
      "exchangeAuthorizationCode",
      "freezeCard",
      "getCardLinkedWallets",
      "getCardOnboardingStatus",
      "getCardStatus",
      "getInternalWallets",
      "getUser",
      "logout",
      "orderCard",
      "refreshSession",
      "unfreezeCard",
    ]);
  });

  it("names both OAuth2 grants in the list the redaction reads", () => {
    expect([...CARD_GRANT_ENDPOINTS].sort()).toEqual([
      "exchangeAuthorizationCode",
      "refreshSession",
    ]);
    for (const name of CARD_GRANT_ENDPOINTS) {
      expect(Object.keys(cardManagementApi.endpoints)).toContain(name);
    }
  });

  it("exports no hook for credential-bearing endpoints", () => {
    expect(Object.keys(apiModule)).not.toContain("useExchangeAuthorizationCodeMutation");
    expect(Object.keys(apiModule)).not.toContain("useRefreshSessionMutation");
    expect(Object.keys(apiModule)).not.toContain("useLogoutMutation");
  });

  it("exposes orderCard and its hook", () => {
    expect(cardManagementApi.endpoints.orderCard).toBeDefined();
    expect(useOrderCardMutation).toBeDefined();
  });

  it("exposes getCardStatus with its hook and the lazy hook the devtool presses", () => {
    expect(cardManagementApi.endpoints.getCardStatus).toBeDefined();
    expect(useGetCardStatusQuery).toBeDefined();
    expect(useLazyGetCardStatusQuery).toBeDefined();
  });

  it("exposes createCardDetailsToken and its hook", () => {
    expect(cardManagementApi.endpoints.createCardDetailsToken).toBeDefined();
    expect(useCreateCardDetailsTokenMutation).toBeDefined();
  });

  it("exposes freezeCard and unfreezeCard with their hooks", () => {
    expect(cardManagementApi.endpoints.freezeCard).toBeDefined();
    expect(useFreezeCardMutation).toBeDefined();
    expect(cardManagementApi.endpoints.unfreezeCard).toBeDefined();
    expect(useUnfreezeCardMutation).toBeDefined();
  });

  it("exposes both wallet endpoints with their hooks", () => {
    expect(cardManagementApi.endpoints.getInternalWallets).toBeDefined();
    expect(useGetInternalWalletsQuery).toBeDefined();
    expect(cardManagementApi.endpoints.getCardLinkedWallets).toBeDefined();
    expect(useGetCardLinkedWalletsQuery).toBeDefined();
  });

  it("exposes getCardOnboardingStatus and its hook", () => {
    expect(cardManagementApi.endpoints.getCardOnboardingStatus).toBeDefined();
    expect(useGetCardOnboardingStatusQuery).toBeDefined();
  });

  it("registers under the shared cardApi reducer path", () => {
    const store = makeStore();

    expect(store.getState()).toHaveProperty(cardManagementApi.reducerPath);
  });
});

describe("cardManagementApi requests", () => {
  describe("the OAuth2 grants", () => {
    const TOKEN_PATH = "/v1/auth/oauth2/token";

    const sessionResponse = {
      access_token: "at_token",
      expires_in: 21600,
      refresh_token: "rt_token",
    };

    const session = {
      accessToken: "at_token",
      expiresIn: 21600,
      refreshToken: "rt_token",
    };

    it("exchanges the code and the verifier for a session", async () => {
      provider.post(TOKEN_PATH, () => jsonResponse(sessionResponse));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.exchangeAuthorizationCode.initiate(
          { code: "auth-code", codeVerifier: "verifier" },
          { track: false },
        ),
      );

      expect(result.data).toEqual(session);
      expect(provider.sent().url).toBe(`${CARD_API_BASE_URL}${TOKEN_PATH}`);
      expect(JSON.parse(provider.sent().body)).toEqual({
        grant_type: "authorization_code",
        code: "auth-code",
        code_verifier: "verifier",
      });
    });

    it("rotates the session with the refresh token, and sends no bearer token", async () => {
      provider.post(TOKEN_PATH, () => jsonResponse(sessionResponse));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.refreshSession.initiate(
          { refreshToken: "rt_stored" },
          { track: false },
        ),
      );

      expect(result.data).toEqual(session);
      expect(JSON.parse(provider.sent().body)).toEqual({
        grant_type: "refresh_token",
        refresh_token: "rt_stored",
      });
      expect(provider.sent().headers.get("authorization")).toBeNull();
      expect(provider.sent().headers.get("x-client-key")).toBe("client-key");
    });

    it("caches nothing, because both grants run untracked", async () => {
      provider.post(TOKEN_PATH, () => jsonResponse(sessionResponse));

      const store = makeStore("session-token");
      await store.dispatch(
        cardManagementApi.endpoints.refreshSession.initiate(
          { refreshToken: "rt_stored" },
          { track: false },
        ),
      );

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const state = store.getState()[cardApi.reducerPath] as { mutations: object };
      expect(state.mutations).toEqual({});
    });

    it("quotes no token when the answer is not a session", async () => {
      provider.post(TOKEN_PATH, () =>
        jsonResponse({
          access_token: "sensitive-access-token",
          refresh_token: "sensitive-refresh-token",
        }),
      );

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.refreshSession.initiate(
          { refreshToken: "rt_stored" },
          { track: false },
        ),
      );

      expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
      expect(JSON.stringify(result.error)).toContain("rawResponseSchema");
      expect(JSON.stringify(result.error)).not.toContain("sensitive-access-token");
      expect(JSON.stringify(result.error)).not.toContain("sensitive-refresh-token");
    });

    it("fails with 400 when the provider refuses the grant", async () => {
      provider.post(TOKEN_PATH, () => errorResponse(400, "invalid_grant"));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.refreshSession.initiate(
          { refreshToken: "rt_stored" },
          { track: false },
        ),
      );

      expect(result.error).toMatchObject({ status: 400 });
    });
  });

  describe("logout", () => {
    it("omits the bearer token when no session is open", async () => {
      provider.post("/v1/auth/logout", () => jsonResponse({ success: true }));

      const store = makeStore();
      const result = await store.dispatch(cardManagementApi.endpoints.logout.initiate({}));

      expect(provider.sent().headers.get("authorization")).toBeNull();
      expect(result.data).toEqual({ success: true });
    });

    it("sends the captured bearer token alongside the client key", async () => {
      provider.post("/v1/auth/logout", () => jsonResponse({ success: true }));

      const store = makeStore("session-token");
      const result = await store.dispatch(initiatePayCardLogout("session-token"));

      expectSessionRequest("POST", "/v1/auth/logout");
      expect(result.data).toEqual({ success: true });
    });

    it("omits the bearer token when none was captured", async () => {
      provider.post("/v1/auth/logout", () => jsonResponse({ success: true }));

      const store = makeStore();
      await store.dispatch(initiatePayCardLogout(null));

      expect(provider.sent().headers.get("authorization")).toBeNull();
    });

    it("does not start another renewal when logout answers 401", async () => {
      provider.post("/v1/auth/logout", () => errorResponse(401, "unauthorized"));
      const refreshCardSession = jest.fn(async () => ({ kind: "session-ended" as const }));
      const store = makeStore("session-token", { refreshCardSession });

      await store.dispatch(initiatePayCardLogout("session-token"));

      expect(refreshCardSession).not.toHaveBeenCalled();
      expect(provider.requests()).toHaveLength(1);
    });

    it("sends a captured bearer after the local session has ended", async () => {
      provider.post("/v1/auth/logout", () => jsonResponse({ success: true }));
      const readCardSession = jest.fn(async () => ({ token: null, sessionId: 2 }));
      const store = makeStore(null, { readCardSession });

      const logout = store.dispatch(initiatePayCardLogout("captured-token"));
      await logout;

      expect(provider.sent().headers.get("authorization")).toBe("Bearer captured-token");
      expect(readCardSession).not.toHaveBeenCalled();
      expect(JSON.stringify(logout.arg.originalArgs)).not.toContain("captured-token");
    });

    it("survives an API cache reset after the POST starts", async () => {
      const answer = deferred<Response>();
      provider.post("/v1/auth/logout", () => answer.promise);
      const store = makeStore();
      const logout = store.dispatch(initiatePayCardLogout("captured-token"));
      await flushPendingRequests();

      store.dispatch(cardManagementApi.util.resetApiState());

      expect(provider.requests()).toHaveLength(1);
      await expect(logout.unwrap()).rejects.toMatchObject({ name: "AbortError" });
      answer.resolve(jsonResponse({ success: true }));
      await flushPendingRequests();
    });
  });

  describe("getUser", () => {
    it("returns the id and the verification state, and drops the personal data", async () => {
      provider.get("/v1/user", () =>
        jsonResponse({
          id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
          verificationState: "VERIFIED",
          firstName: "Ada",
          lastName: "Lovelace",
          dateOfBirth: "1815-12-10",
          email: "ada@example.com",
          phoneNumber: "0100000000",
          addressLine1: "1 Main St",
          city: "London",
          zip: "SW1A",
          ssn: "000-00-0000",
        }),
      );

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getUser.initiate());

      expectSessionRequest("GET", "/v1/user");
      expect(result.data).toEqual({
        id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        verificationState: "VERIFIED",
      });
    });

    it("rejects a response that does not match the wire contract", async () => {
      provider.get("/v1/user", () =>
        jsonResponse({ id: "not-a-uuid", verification_state: "VERIFIED" }),
      );

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getUser.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("orderCard", () => {
    it("orders a virtual card", async () => {
      provider.post("/v1/card/order", () => jsonResponse({ success: true }));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.orderCard.initiate());

      expectSessionRequest("POST", "/v1/card/order");
      expect(JSON.parse(provider.sent().body)).toEqual({ type: "VIRTUAL" });
      expect(result.data).toEqual({ success: true });
    });

    it("rejects a response whose success flag is not a boolean", async () => {
      provider.post("/v1/card/order", () => jsonResponse({ success: "yes" }));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.orderCard.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("getCardStatus", () => {
    it("reads the card status", async () => {
      provider.get("/v1/card/status", () => jsonResponse(cardStatus));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getCardStatus.initiate());

      expectSessionRequest("GET", "/v1/card/status");
      expect(result.data).toEqual(cardStatus);
    });

    it("fails with 404 when the user never ordered a card", async () => {
      provider.get("/v1/card/status", () => errorResponse(404, "Card not found"));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getCardStatus.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toMatchObject({ status: 404 });
    });

    it("rejects a status the wire contract does not name", async () => {
      provider.get("/v1/card/status", () =>
        jsonResponse({ ...cardStatus, status: "SOMETHING_ELSE" }),
      );

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.getCardStatus.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it("refetches after an order", async () => {
      provider.get("/v1/card/status", () => jsonResponse(cardStatus));
      provider.post("/v1/card/order", () => jsonResponse({ success: true }));

      const store = makeStore("session-token");
      const status = store.dispatch(
        cardManagementApi.endpoints.getCardStatus.initiate(undefined, { subscribe: true }),
      );
      await status;
      await store.dispatch(cardManagementApi.endpoints.orderCard.initiate());
      await flushPendingRequests();

      expect(provider.sentTo("/v1/card/status")).toHaveLength(2);

      status.unsubscribe();
    });
  });

  describe("freezeCard", () => {
    it("freezes the card", async () => {
      provider.post("/v1/card/freeze", () => jsonResponse({ success: true }));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.freezeCard.initiate());

      expectSessionRequest("POST", "/v1/card/freeze");
      expect(result.data).toEqual({ success: true });
    });

    it("fails with 400 when the card is already frozen", async () => {
      provider.post("/v1/card/freeze", () => errorResponse(400, "Card is already frozen"));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.freezeCard.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toMatchObject({
        status: 400,
        data: { message: "Card is already frozen" },
      });
    });

    it("shows FROZEN in the status cache while in flight, and rolls back when it fails", async () => {
      const freeze = deferred<Response>();
      provider.get("/v1/card/status", () => jsonResponse(cardStatus));
      provider.post("/v1/card/freeze", () => freeze.promise);

      const store = makeStore("session-token");
      const subscription = store.dispatch(
        cardManagementApi.endpoints.getCardStatus.initiate(undefined, { subscribe: true }),
      );
      await subscription;

      const mutation = store.dispatch(cardManagementApi.endpoints.freezeCard.initiate());

      expect(
        cardManagementApi.endpoints.getCardStatus.select()(store.getState()).data?.status,
      ).toBe("FROZEN");

      freeze.resolve(errorResponse(500, "Freeze failed"));
      await mutation;
      expect(
        cardManagementApi.endpoints.getCardStatus.select()(store.getState()).data?.status,
      ).toBe("ACTIVE");

      subscription.unsubscribe();
    });

    it("freezes without patching a status cache entry that holds no value", async () => {
      provider.get("/v1/card/status", () => jsonResponse(cardStatus));
      provider.post("/v1/card/freeze", () => jsonResponse({ success: true }));

      const store = makeStore("session-token");
      const subscription = store.dispatch(
        cardManagementApi.endpoints.getCardStatus.initiate(undefined, { subscribe: true }),
      );
      await subscription;
      // An emptied entry is handed to the optimistic recipe as-is, where a populated one arrives as
      // a draft: patching it would read a status off nothing.
      store.dispatch(
        cardManagementApi.util.patchQueryData("getCardStatus", undefined, [
          { op: "replace", path: [], value: undefined },
        ]),
      );

      const result = await store.dispatch(cardManagementApi.endpoints.freezeCard.initiate());

      expect(result.data).toEqual({ success: true });

      subscription.unsubscribe();
    });

    it("refetches the card status, which then reads FROZEN", async () => {
      let cardState = "ACTIVE";
      provider.get("/v1/card/status", () => jsonResponse({ ...cardStatus, status: cardState }));
      provider.post("/v1/card/freeze", () => {
        cardState = "FROZEN";
        return jsonResponse({ success: true });
      });

      const store = makeStore("session-token");
      const subscription = store.dispatch(
        cardManagementApi.endpoints.getCardStatus.initiate(undefined, { subscribe: true }),
      );
      await subscription;
      await store.dispatch(cardManagementApi.endpoints.freezeCard.initiate());
      await flushPendingRequests();

      expect(provider.sentTo("/v1/card/status")).toHaveLength(2);
      expect(
        cardManagementApi.endpoints.getCardStatus.select()(store.getState()).data?.status,
      ).toBe("FROZEN");

      subscription.unsubscribe();
    });
  });

  describe("unfreezeCard", () => {
    it("unfreezes the card", async () => {
      provider.post("/v1/card/unfreeze", () => jsonResponse({ success: true }));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.unfreezeCard.initiate());

      expectSessionRequest("POST", "/v1/card/unfreeze");
      expect(result.data).toEqual({ success: true });
    });

    it("fails with 400 when the card is not frozen", async () => {
      provider.post("/v1/card/unfreeze", () => errorResponse(400, "Card is not frozen"));

      const store = makeStore("session-token");
      const result = await store.dispatch(cardManagementApi.endpoints.unfreezeCard.initiate());

      expect(result.data).toBeUndefined();
      expect(result.error).toMatchObject({ status: 400, data: { message: "Card is not frozen" } });
    });

    it("shows ACTIVE in the status cache while in flight, and rolls back when it fails", async () => {
      const unfreeze = deferred<Response>();
      provider.get("/v1/card/status", () => jsonResponse({ ...cardStatus, status: "FROZEN" }));
      provider.post("/v1/card/unfreeze", () => unfreeze.promise);

      const store = makeStore("session-token");
      const subscription = store.dispatch(
        cardManagementApi.endpoints.getCardStatus.initiate(undefined, { subscribe: true }),
      );
      await subscription;

      const mutation = store.dispatch(cardManagementApi.endpoints.unfreezeCard.initiate());

      expect(
        cardManagementApi.endpoints.getCardStatus.select()(store.getState()).data?.status,
      ).toBe("ACTIVE");

      unfreeze.resolve(errorResponse(500, "Unfreeze failed"));
      await mutation;
      expect(
        cardManagementApi.endpoints.getCardStatus.select()(store.getState()).data?.status,
      ).toBe("FROZEN");

      subscription.unsubscribe();
    });

    it("refetches the card status, which then reads ACTIVE", async () => {
      let cardState = "FROZEN";
      provider.get("/v1/card/status", () => jsonResponse({ ...cardStatus, status: cardState }));
      provider.post("/v1/card/unfreeze", () => {
        cardState = "ACTIVE";
        return jsonResponse({ success: true });
      });

      const store = makeStore("session-token");
      const subscription = store.dispatch(
        cardManagementApi.endpoints.getCardStatus.initiate(undefined, { subscribe: true }),
      );
      await subscription;
      await store.dispatch(cardManagementApi.endpoints.unfreezeCard.initiate());
      await flushPendingRequests();

      expect(provider.sentTo("/v1/card/status")).toHaveLength(2);
      expect(
        cardManagementApi.endpoints.getCardStatus.select()(store.getState()).data?.status,
      ).toBe("ACTIVE");

      subscription.unsubscribe();
    });
  });

  describe("getInternalWallets", () => {
    const INTERNAL_WALLETS_PATH = "/v1/wallet/internal";

    const readWallets = () =>
      makeStore("session-token").dispatch(
        cardManagementApi.endpoints.getInternalWallets.initiate(),
      );

    it("reads every custodial wallet", async () => {
      provider.get(INTERNAL_WALLETS_PATH, () => jsonResponse(internalWalletsOnTheWire));

      const result = await readWallets();

      expectSessionRequest("GET", INTERNAL_WALLETS_PATH);
      expect(result.data).toEqual(internalWallets);
    });

    it("keeps the balance a string, so its precision survives", async () => {
      provider.get(INTERNAL_WALLETS_PATH, () =>
        jsonResponse([{ ...internalWallets[0], balance: "9007199254740993.000001" }]),
      );

      const result = await readWallets();

      expect(result.data?.[0].balance).toBe("9007199254740993.000001");
    });

    it("drops the keys the wire contract does not declare", async () => {
      provider.get(INTERNAL_WALLETS_PATH, () => jsonResponse([internalWalletsOnTheWire[0]]));

      const result = await readWallets();

      expect(result.data).toEqual([internalWallets[0]]);
    });

    it("returns an empty list when the user has no wallet", async () => {
      provider.get(INTERNAL_WALLETS_PATH, () => jsonResponse([]));

      const result = await readWallets();

      expect(result.data).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it("rejects a balance sent as a number", async () => {
      provider.get(INTERNAL_WALLETS_PATH, () =>
        jsonResponse([{ ...internalWallets[0], balance: 125.4 }]),
      );

      const result = await readWallets();

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it("rejects an envelope where the contract promises a bare array", async () => {
      provider.get(INTERNAL_WALLETS_PATH, () => jsonResponse({ wallets: internalWallets }));

      const result = await readWallets();

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("createCardDetailsToken", () => {
    const DETAILS_TOKEN_PATH = "/v1/card/details/token";

    // An all-zero token: a real-looking one trips secret scanning.
    const detailsToken = {
      token: "00000000-0000-4000-8000-000000000000",
      imageUrl: "https://card.test/details-image?token=00000000-0000-4000-8000-000000000000",
    };

    it("mints a token, and sends no body when no colour is asked for", async () => {
      provider.post(DETAILS_TOKEN_PATH, () => jsonResponse(detailsToken));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.createCardDetailsToken.initiate(),
      );

      expectSessionRequest("POST", DETAILS_TOKEN_PATH);
      expect(provider.sent().body).toBe("");
      expect(result.data).toEqual(detailsToken);
    });

    it("sends the colours the host asked for", async () => {
      provider.post(DETAILS_TOKEN_PATH, () => jsonResponse(detailsToken));

      const store = makeStore("session-token");
      await store
        .dispatch(
          cardManagementApi.endpoints.createCardDetailsToken.initiate({ panTextColor: "#000000" }),
        )
        .unwrap();

      expect(JSON.parse(provider.sent().body)).toEqual({
        customCss: { panTextColor: "#000000" },
      });
    });

    it("rejects a colour that is not a hex value, and sends no request", async () => {
      provider.post(DETAILS_TOKEN_PATH, () => jsonResponse(detailsToken));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.createCardDetailsToken.initiate({
          cardBackgroundColor: "rebeccapurple",
        }),
      );

      expect(result.error).toBeDefined();
      expect(provider.requests()).toEqual([]);
    });

    it("rejects an image url that is not https, which is loaded straight into an image", async () => {
      provider.post(DETAILS_TOKEN_PATH, () =>
        jsonResponse({ ...detailsToken, imageUrl: "javascript:alert(1)" }),
      );

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.createCardDetailsToken.initiate(),
      );

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it("stores neither the token nor the image url when the caller does not track it", async () => {
      provider.post(DETAILS_TOKEN_PATH, () => jsonResponse(detailsToken));

      const store = makeStore("session-token");
      await store
        .dispatch(
          cardManagementApi.endpoints.createCardDetailsToken.initiate(undefined, {
            track: false,
          }),
        )
        .unwrap();

      const state = JSON.stringify(store.getState().cardApi);
      expect(state).not.toContain(detailsToken.token);
      expect(state).not.toContain("details-image");
    });

    it("leaves the token in redux when the caller tracks it, which is why callers must not", async () => {
      provider.post(DETAILS_TOKEN_PATH, () => jsonResponse(detailsToken));

      const store = makeStore("session-token");
      await store.dispatch(cardManagementApi.endpoints.createCardDetailsToken.initiate()).unwrap();

      expect(JSON.stringify(store.getState().cardApi.mutations)).toContain(detailsToken.token);
    });
  });

  describe("getCardLinkedWallets", () => {
    const LINKED_WALLETS_PATH = "/v1/wallet/internal/card_linked";

    const readLinkedWallets = () =>
      makeStore("session-token").dispatch(
        cardManagementApi.endpoints.getCardLinkedWallets.initiate(),
      );

    it("reads the wallets funding the card", async () => {
      provider.get(LINKED_WALLETS_PATH, () => jsonResponse(linkedWallets));

      const result = await readLinkedWallets();

      expectSessionRequest("GET", LINKED_WALLETS_PATH);
      expect(result.data).toEqual(linkedWallets);
    });

    it("keeps a priority of zero, which is the first wallet charged", async () => {
      provider.get(LINKED_WALLETS_PATH, () => jsonResponse([{ ...linkedWallets[0], priority: 0 }]));

      const result = await readLinkedWallets();

      expect(result.data?.[0].priority).toBe(0);
    });

    it("returns an empty list when nothing is linked to the card", async () => {
      provider.get(LINKED_WALLETS_PATH, () => jsonResponse([]));

      const result = await readLinkedWallets();

      expect(result.data).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it("rejects a priority that is not a number", async () => {
      provider.get(LINKED_WALLETS_PATH, () =>
        jsonResponse([{ ...linkedWallets[0], priority: "1" }]),
      );

      const result = await readLinkedWallets();

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("getCardOnboardingStatus", () => {
    const ONBOARDING_STATUS_PATH = "/v1/card/onboarding-status";

    const onboardingStatus = {
      steps: [
        {
          id: "kyc",
          title: "Verify your identity",
          description: "Complete KYC verification to activate your card.",
          isDone: true,
        },
        {
          id: "address",
          title: "Add shipping address",
          description: "Tell us where to send your physical card.",
          isDone: false,
        },
      ],
    };

    it("reads the onboarding steps", async () => {
      provider.get(ONBOARDING_STATUS_PATH, () => jsonResponse(onboardingStatus));

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getCardOnboardingStatus.initiate(),
      );

      expectSessionRequest("GET", ONBOARDING_STATUS_PATH);
      expect(result.data).toEqual(onboardingStatus);
    });

    it("rejects a step whose done flag is not a boolean", async () => {
      provider.get(ONBOARDING_STATUS_PATH, () =>
        jsonResponse({ steps: [{ ...onboardingStatus.steps[0], isDone: "yes" }] }),
      );

      const store = makeStore("session-token");
      const result = await store.dispatch(
        cardManagementApi.endpoints.getCardOnboardingStatus.initiate(),
      );

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });
});

