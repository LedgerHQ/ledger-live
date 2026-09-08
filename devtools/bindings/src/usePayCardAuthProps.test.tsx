import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { cardSession, readCardSession, refreshCardSession } from "@features/platform-card";
import { cardApi } from "@shared/api-services";
import { usePayCardAuthProps } from "./usePayCardAuthProps";

jest.mock("@features/platform-card", () => ({
  cardSession: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
  readCardSession: jest.fn(),
  refreshCardSession: jest.fn(),
}));

const mockedGet = jest.mocked(cardSession.get);
const mockedSet = jest.mocked(cardSession.set);
const mockedClear = jest.mocked(cardSession.clear);
const mockedReadCardSession = jest.mocked(readCardSession);
const mockedRefreshCardSession = jest.mocked(refreshCardSession);

type MockResponse = { id: string; label: string; hint: string };
type CardMockState = {
  tokenResponse: string;
  responses: readonly MockResponse[];
  userUnauthorizedOnce: boolean;
  refreshCount: number;
};
type MockHost = { payCardMockState?: CardMockState };

const RESPONSES: readonly MockResponse[] = [
  { id: "pass", label: "Off", hint: "The mock stands aside." },
  { id: "400", label: "400", hint: "invalid_grant." },
];

function installMockState(overrides: Partial<CardMockState> = {}): CardMockState {
  const state: CardMockState = {
    tokenResponse: "pass",
    responses: RESPONSES,
    userUnauthorizedOnce: false,
    refreshCount: 0,
    ...overrides,
  };
  (globalThis as MockHost).payCardMockState = state;
  return state;
}

type StubEndpoint = { initiate: () => () => Promise<{ error?: unknown }> };
type CardEndpoints = { endpoints: { getUser?: StubEndpoint } };
const cardEndpoints = cardApi as unknown as CardEndpoints;

function stubGetUser(answer: { error?: unknown }): void {
  cardEndpoints.endpoints.getUser = { initiate: () => () => Promise.resolve(answer) };
}

function buildStore() {
  return configureStore({
    reducer: { [cardApi.reducerPath]: cardApi.reducer },
    middleware: gdm => gdm().concat(cardApi.middleware),
  });
}

function withStore(store: ReturnType<typeof buildStore>) {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
}

const SESSION = { accessToken: "at_fake_access_token", refreshToken: "rt_fake_refresh_token" };

function renderAuth(options: { openPayTab?: () => void } = {}) {
  return renderHook(() => usePayCardAuthProps(options), { wrapper: withStore(buildStore()) });
}

async function renderSettledAuth(options: { openPayTab?: () => void } = {}) {
  const rendered = renderAuth(options);
  await waitFor(() => expect(mockedGet).toHaveBeenCalled());
  return rendered;
}

type AuthResult = { current: ReturnType<typeof usePayCardAuthProps> };

async function runAndReadResult(trigger: () => void, result: AuthResult) {
  const previousId = result.current.lastResult?.id ?? 0;
  await act(async () => {
    trigger();
  });
  await waitFor(() => expect(result.current.lastResult?.id ?? 0).toBeGreaterThan(previousId));
  return result.current.lastResult!;
}

describe("usePayCardAuthProps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (globalThis as MockHost).payCardMockState;
    delete cardEndpoints.endpoints.getUser;
    mockedGet.mockResolvedValue(null);
    mockedSet.mockResolvedValue(undefined);
    mockedClear.mockResolvedValue(undefined);
  });

  describe("the stored session", () => {
    it("should read the session when the hook mounts", async () => {
      mockedGet.mockResolvedValue(SESSION);

      const { result } = renderAuth();

      await waitFor(() => expect(result.current.session).toEqual(SESSION));
      expect(result.current.sessionError).toBeNull();
    });

    it("should report why the secure store refused a read", async () => {
      mockedGet.mockRejectedValue(new Error("the keychain is locked"));

      const { result } = renderAuth();

      await waitFor(() => expect(result.current.sessionError).toBe("the keychain is locked"));
      expect(result.current.session).toBeNull();
    });

    it("should report a rejection that is not an Error as text", async () => {
      mockedGet.mockRejectedValue("the user cancelled");

      const { result } = renderAuth();

      await waitFor(() => expect(result.current.sessionError).toBe("the user cancelled"));
    });
  });

  describe("the secure storage actions", () => {
    it("should say the tokens came from the keychain", async () => {
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.readTokens(), result);

      expect(lastResult).toEqual({
        id: 1,
        message: "get auth tokens → read from the keychain",
        failed: false,
      });
    });

    it("should damage the access token so the next request answers 401", async () => {
      mockedGet.mockResolvedValue({ accessToken: "abc", refreshToken: "def" });
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.breakAccessToken(), result);

      expect(mockedSet).toHaveBeenCalledWith({ accessToken: "Xbc", refreshToken: "def" });
      expect(lastResult.message).toBe(
        "break access token → the next request must answer 401 and renew",
      );
    });

    it("should damage an access token that already starts with the marker", async () => {
      mockedGet.mockResolvedValue({ accessToken: "Xbc", refreshToken: "def" });
      const { result } = await renderSettledAuth();

      await runAndReadResult(() => result.current.breakAccessToken(), result);

      expect(mockedSet).toHaveBeenCalledWith({ accessToken: "Ybc", refreshToken: "def" });
    });

    it("should damage the refresh token so the next renewal ends the session", async () => {
      mockedGet.mockResolvedValue({ accessToken: "abc", refreshToken: "def" });
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.breakRefreshToken(), result);

      expect(mockedSet).toHaveBeenCalledWith({ accessToken: "abc", refreshToken: "Xef" });
      expect(lastResult.message).toBe(
        "break refresh token → the next renewal must end the session",
      );
    });

    it("should damage a refresh token that already starts with the marker", async () => {
      mockedGet.mockResolvedValue({ accessToken: "abc", refreshToken: "Xef" });
      const { result } = await renderSettledAuth();

      await runAndReadResult(() => result.current.breakRefreshToken(), result);

      expect(mockedSet).toHaveBeenCalledWith({ accessToken: "abc", refreshToken: "Yef" });
    });

    it("should refuse to damage the access token with no session stored", async () => {
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.breakAccessToken(), result);

      expect(mockedSet).not.toHaveBeenCalled();
      expect(lastResult.message).toBe("break access token → no session");
    });

    it("should refuse to damage the refresh token with no session stored", async () => {
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.breakRefreshToken(), result);

      expect(mockedSet).not.toHaveBeenCalled();
      expect(lastResult.message).toBe("break refresh token → no session");
    });

    it("should clear the session", async () => {
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.clearSession(), result);

      expect(mockedClear).toHaveBeenCalledTimes(1);
      expect(lastResult.message).toBe("clear → cleared");
    });
  });

  describe("the renewal", () => {
    it("should report the new access token, masked", async () => {
      mockedReadCardSession.mockResolvedValue({ sessionId: 1, token: "at_old" });
      mockedRefreshCardSession.mockResolvedValue({
        kind: "refreshed",
        accessToken: "at_new_1234567890",
      });
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.renewNow(), result);

      expect(mockedRefreshCardSession).toHaveBeenCalledWith(1, "at_old");
      expect(lastResult.message).toBe("renew → refreshed at_new_12…");
    });

    it("should say there is no session when the store holds no token", async () => {
      mockedReadCardSession.mockResolvedValue({ sessionId: 1, token: null });
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.renewNow(), result);

      expect(mockedRefreshCardSession).not.toHaveBeenCalled();
      expect(lastResult.message).toBe("renew → no session");
    });

    it("should report an outcome that is not a renewal by its kind", async () => {
      mockedReadCardSession.mockResolvedValue({ sessionId: 1, token: "at_old" });
      mockedRefreshCardSession.mockResolvedValue({ kind: "session-ended" });
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.renewNow(), result);

      expect(lastResult.message).toBe("renew → session-ended");
    });

    it("should report a failed action and mark it failed", async () => {
      mockedReadCardSession.mockRejectedValue(new Error("the provider is down"));
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.renewNow(), result);

      expect(lastResult).toMatchObject({
        message: "renew failed: the provider is down",
        failed: true,
      });
    });

    it("should report a failure that is not an Error as text", async () => {
      mockedReadCardSession.mockRejectedValue("no answer");
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.renewNow(), result);

      expect(lastResult.message).toBe("renew failed: no answer");
    });

    it("should mask an empty access token as no token at all", async () => {
      mockedReadCardSession.mockResolvedValue({ sessionId: 1, token: "at_old" });
      mockedRefreshCardSession.mockResolvedValue({ kind: "refreshed", accessToken: "" });
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.renewNow(), result);

      expect(lastResult.message).toBe("renew → refreshed null");
    });
  });

  it("should drop the answer of an action that lands after the tool is left", async () => {
    let releaseRead: (value: null) => void = () => {};
    mockedGet.mockResolvedValueOnce(null).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          releaseRead = resolve;
        }),
    );
    const { result, unmount } = await renderSettledAuth();

    act(() => result.current.readTokens());
    unmount();
    await act(async () => {
      releaseRead(null);
    });

    expect(result.current.lastResult).toBeNull();
  });

  describe("the user request", () => {
    it("should say so when the endpoint is not registered", async () => {
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.fetchUser(), result);

      expect(lastResult.message).toBe("get user → unavailable (endpoint not registered)");
    });

    it("should report the answer as ok", async () => {
      stubGetUser({});
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.fetchUser(), result);

      expect(lastResult.message).toBe("get user → ok");
    });

    it("should report an answer that carries an error as failed", async () => {
      stubGetUser({ error: { status: 401 } });
      const { result } = await renderSettledAuth();

      const lastResult = await runAndReadResult(() => result.current.fetchUser(), result);

      expect(lastResult.message).toBe("get user → failed");
    });
  });

  describe("the renewal mock controls", () => {
    it("should report the mock as off when the app runs without it", async () => {
      const { result } = await renderSettledAuth();

      expect(result.current.mock).toMatchObject({
        available: false,
        response: "pass",
        responses: [],
        renewals: 0,
      });
    });

    it("should read the mock state the app installed", async () => {
      installMockState({ tokenResponse: "400", refreshCount: 3 });

      const { result } = await renderSettledAuth();

      expect(result.current.mock).toMatchObject({
        available: true,
        response: "400",
        responses: RESPONSES,
        renewals: 3,
      });
    });

    it("should set what the mocked token endpoint answers", async () => {
      const state = installMockState();
      const { result } = await renderSettledAuth();

      act(() => result.current.mock.setResponse("400"));

      expect(state.tokenResponse).toBe("400");
      expect(result.current.mock.response).toBe("400");
    });

    it("should reset the renewal count", async () => {
      const state = installMockState({ refreshCount: 7 });
      const { result } = await renderSettledAuth();

      act(() => result.current.mock.resetRenewals());

      expect(state.refreshCount).toBe(0);
      expect(result.current.mock.renewals).toBe(0);
    });

    it("should arm the next user call to answer 401", async () => {
      const state = installMockState();
      const { result } = await renderSettledAuth();

      act(() => result.current.mock.armUnauthorized());

      expect(state.userUnauthorizedOnce).toBe(true);
      expect(result.current.lastResult).toEqual({
        id: 1,
        message: "the next user call answers 401",
        failed: false,
      });
    });

    it("should keep the controls harmless with no mock state installed", async () => {
      const { result } = await renderSettledAuth();

      act(() => result.current.mock.setResponse("400"));
      act(() => result.current.mock.resetRenewals());
      act(() => result.current.mock.armUnauthorized());

      expect(result.current.mock).toMatchObject({ available: false, response: "pass" });
      expect(result.current.lastResult?.message).toBe("the next user call answers 401");
    });
  });

  it("should number each result, so a repeated action still shows a new toast", async () => {
    const { result } = await renderSettledAuth();

    await runAndReadResult(() => result.current.readTokens(), result);
    const second = await runAndReadResult(() => result.current.readTokens(), result);

    expect(second.id).toBe(2);
  });

  it("should hand the host's Pay tab action through", async () => {
    const openPayTab = jest.fn();

    const { result } = await renderSettledAuth({ openPayTab });

    expect(result.current.openPayTab).toBe(openPayTab);
  });
});
