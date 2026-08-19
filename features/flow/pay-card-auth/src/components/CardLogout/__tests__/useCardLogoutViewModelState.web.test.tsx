import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { useGetUserQuery } from "@domain/api-card-management";
import { createCardLogoutPorts } from "../../../state/createCardLogoutPorts";
import { payCardAuthSlice, setSignedIn } from "../../../state/slice";
import { useCardLogoutViewModel } from "../useCardLogoutViewModel";

jest.mock("@domain/api-card-management", () => ({ useGetUserQuery: jest.fn() }));
jest.mock("../../../state/createCardLogoutPorts", () => ({ createCardLogoutPorts: jest.fn() }));

const user = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" } as const;

function setUp() {
  const store = configureStore({ reducer: { payCardAuth: payCardAuthSlice.reducer } });

  // Held open, so a test can read the ViewModel while the logout is still running.
  let releaseLogout: (() => void) | undefined;
  const logoutReached = new Promise<void>(resolveReached => {
    jest.mocked(createCardLogoutPorts).mockReturnValue({
      logout: async () => {
        resolveReached();
        await new Promise<void>(resolveRelease => {
          releaseLogout = resolveRelease;
        });
      },
      clearSession: async () => undefined,
      clearAttempt: async () => undefined,
      forgetUser: () => undefined,
      // The real port dispatches, and that dispatch is what takes this component off screen.
      setSignedIn: isSignedIn => store.dispatch(setSignedIn(isSignedIn)),
    });
  });

  // Only `data` is read here, and the full hook result carries three dozen fields.
  jest
    .mocked(useGetUserQuery)
    .mockReturnValue({ data: user } as unknown as ReturnType<typeof useGetUserQuery>);
  store.dispatch(setSignedIn(true));

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const view = renderHook(() => useCardLogoutViewModel(), { wrapper });

  return { store, view, logoutReached, release: () => releaseLogout?.() };
}

describe("useCardLogoutViewModel", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("offers the action as soon as the card holder is signed in", () => {
    const { view } = setUp();

    expect(view.result.current?.isLoading).toBe(false);
    expect(view.result.current?.userId).toBe(user.id);
  });

  it("keeps the action busy while the logout runs", async () => {
    const { view, logoutReached, release } = setUp();

    act(() => view.result.current?.onLogoutPress());
    await act(async () => {
      await logoutReached;
    });

    expect(view.result.current?.isLoading).toBe(true);
    release();
  });

  it("shows nothing once the logout is through", async () => {
    const { view, logoutReached, release } = setUp();

    act(() => view.result.current?.onLogoutPress());
    await act(async () => {
      await logoutReached;
    });
    await act(async () => {
      release();
    });

    await waitFor(() => expect(view.result.current).toBeNull());
  });

  it("offers a ready action again after a logout and a new login", async () => {
    // The caller keeps this component mounted while it renders nothing, so a flag left raised by the
    // logout would still be raised here, and the button would sit in its loading state for good.
    const { store, view, logoutReached, release } = setUp();
    act(() => view.result.current?.onLogoutPress());
    await act(async () => {
      await logoutReached;
    });
    await act(async () => {
      release();
    });
    await waitFor(() => expect(view.result.current).toBeNull());

    act(() => {
      store.dispatch(setSignedIn(true));
    });

    await waitFor(() => expect(view.result.current?.isLoading).toBe(false));
    expect(view.result.current?.userId).toBe(user.id);
  });
});
