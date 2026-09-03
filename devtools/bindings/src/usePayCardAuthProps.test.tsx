import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { cardApi } from "@shared/api-services";
import { cardSession } from "@features/platform-card";
import { usePayCardAuthProps } from "./usePayCardAuthProps";

type MockHost = { payCardMockState?: Record<string, unknown> };

function buildStore() {
  return configureStore({
    reducer: { [cardApi.reducerPath]: cardApi.reducer },
    middleware: gdm => gdm().concat(cardApi.middleware),
  });
}

function withStore(store: ReturnType<typeof buildStore>) {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
}

const session = { accessToken: "at_token", refreshToken: "rt_token" };

describe("usePayCardAuthProps", () => {
  let store: ReturnType<typeof buildStore>;

  beforeEach(async () => {
    store = buildStore();
    delete (globalThis as MockHost).payCardMockState;
    await cardSession.clear();
  });

  it("reports no session when nothing is stored", async () => {
    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });

    await waitFor(() => expect(result.current.session).toBeNull());
  });

  it("reports a store it could not read apart from an empty one", async () => {
    const get = jest
      .spyOn(cardSession, "get")
      .mockRejectedValue(new Error("The keychain is locked"));

    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });

    await waitFor(() => expect(result.current.sessionError).toBe("The keychain is locked"));
    expect(result.current.session).toBeNull();
    get.mockRestore();
  });

  it("clears the read failure once the store answers again", async () => {
    const get = jest
      .spyOn(cardSession, "get")
      .mockRejectedValueOnce(new Error("The keychain is locked"));
    await cardSession.set(session);

    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });
    await waitFor(() => expect(result.current.sessionError).not.toBeNull());

    act(() => result.current.readTokens());

    await waitFor(() => expect(result.current.sessionError).toBeNull());
    expect(result.current.session?.accessToken).toBe("at_token");
    get.mockRestore();
  });

  it("reads the stored session", async () => {
    await cardSession.set(session);
    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });

    await waitFor(() => expect(result.current.session).not.toBeNull());
    expect(result.current.session?.accessToken).toBe("at_token");
    expect(result.current.session?.refreshToken).toBe("rt_token");
  });

  it("changes the front of the access token, so the next request answers 401", async () => {
    await cardSession.set(session);
    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });
    await waitFor(() => expect(result.current.session).not.toBeNull());

    act(() => result.current.breakAccessToken());

    await waitFor(() => expect(result.current.session?.accessToken).not.toBe("at_token"));
    const broken = result.current.session?.accessToken ?? "";
    expect(broken).toHaveLength("at_token".length);
    expect(broken[0]).not.toBe("a");
    expect(broken.slice(1)).toBe("t_token");
    expect(result.current.session?.refreshToken).toBe("rt_token");
  });

  it("changes the front of the refresh token, where the panel shows it", async () => {
    await cardSession.set(session);
    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });
    await waitFor(() => expect(result.current.session).not.toBeNull());

    act(() => result.current.breakRefreshToken());

    await waitFor(() => expect(result.current.session?.refreshToken).not.toBe("rt_token"));
    const broken = result.current.session?.refreshToken ?? "";
    expect(broken).toHaveLength("rt_token".length);
    expect(broken[0]).not.toBe("r");
    expect(broken.slice(1)).toBe("t_token");
  });

  it("gives every result a fresh id, so a repeated message still reports", async () => {
    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });
    await waitFor(() => expect(result.current.busy).toBe(false));

    act(() => result.current.readTokens());
    await waitFor(() => expect(result.current.lastResult).not.toBeNull());
    const first = result.current.lastResult;

    act(() => result.current.readTokens());
    await waitFor(() => expect(result.current.lastResult).not.toBe(first));
    expect(result.current.lastResult?.message).toBe(first?.message);
    expect(result.current.lastResult?.id).not.toBe(first?.id);
  });

  it("recovers when an action throws before returning a promise", async () => {
    const clear = jest.spyOn(cardSession, "clear").mockImplementationOnce(() => {
      throw new Error("clear failed");
    });
    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });
    await waitFor(() => expect(result.current.busy).toBe(false));

    act(() => result.current.clearSession());

    await waitFor(() =>
      expect(result.current.lastResult?.message).toBe("clear failed: clear failed"),
    );
    expect(result.current.busy).toBe(false);
    clear.mockRestore();
  });

  it("clears the session", async () => {
    await cardSession.set(session);
    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });
    await waitFor(() => expect(result.current.session).not.toBeNull());

    act(() => result.current.clearSession());

    await waitFor(() => expect(result.current.session).toBeNull());
  });

  it("reports the mock as absent when no handler published one", async () => {
    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });

    await waitFor(() => expect(result.current.mock.available).toBe(false));
    expect(result.current.mock.responses).toEqual([]);
    expect(result.current.mock.renewals).toBe(0);
  });

  it("drives the mock the handler published", async () => {
    (globalThis as MockHost).payCardMockState = {
      tokenResponse: "pass",
      responses: [
        { id: "pass", label: "Off", hint: "The real provider answers." },
        { id: "400", label: "400", hint: "The session must end." },
      ],
      userUnauthorizedOnce: false,
      refreshCount: 3,
    };
    const { result } = renderHook(() => usePayCardAuthProps(), { wrapper: withStore(store) });

    await waitFor(() => expect(result.current.mock.available).toBe(true));
    expect(result.current.mock.responses.map(response => response.label)).toEqual(["Off", "400"]);
    expect(result.current.mock.renewals).toBe(3);

    act(() => result.current.mock.setResponse("400"));
    await waitFor(() => expect(result.current.mock.response).toBe("400"));

    act(() => result.current.mock.resetRenewals());
    await waitFor(() => expect(result.current.mock.renewals).toBe(0));

    act(() => result.current.mock.armUnauthorized());
    expect((globalThis as MockHost).payCardMockState?.userUnauthorizedOnce).toBe(true);
  });
});
