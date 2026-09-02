import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { useGetUserQuery } from "@domain/api-card-management";
import { I18nTestProvider } from "@shared/i18n/testing";
import { createCardLogoutPorts } from "../../../state/createCardLogoutPorts";
import { payCardAuthSlice, setSignedIn } from "../../../state/slice";
import { useCardLogoutViewModel } from "../useCardLogoutViewModel";
import { CARD_MORE_RESOURCES } from "./fixtures";

jest.mock("@domain/api-card-management", () => ({ useGetUserQuery: jest.fn() }));
jest.mock("../../../state/createCardLogoutPorts", () => ({ createCardLogoutPorts: jest.fn() }));

const user = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" } as const;

/** The row the ViewModel gives a real action to. The other three run a shared no-op. */
function pressLogoutRow(model: ReturnType<typeof useCardLogoutViewModel>) {
  model?.rows.find(row => row.id === "logout")?.onPress();
}

function setUp() {
  const store = configureStore({ reducer: { payCardAuth: payCardAuthSlice.reducer } });

  // Held open, so a test can read the ViewModel while the logout is still running.
  let releaseLogout: (() => void) | undefined;
  const logout = jest.fn(async () => undefined);
  const logoutReached = new Promise<void>(resolveReached => {
    logout.mockImplementation(async () => {
      resolveReached();
      await new Promise<void>(resolveRelease => {
        releaseLogout = resolveRelease;
      });
    });
    jest.mocked(createCardLogoutPorts).mockReturnValue({
      logout,
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
    <Provider store={store}>
      <I18nTestProvider resources={CARD_MORE_RESOURCES}>{children}</I18nTestProvider>
    </Provider>
  );
  const view = renderHook(() => useCardLogoutViewModel(), { wrapper });

  return { store, view, logout, logoutReached, release: () => releaseLogout?.() };
}

describe("useCardLogoutViewModel", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("offers the action as soon as the card holder is signed in", () => {
    const { view } = setUp();

    expect(view.result.current?.moreLabel).toBe("More");
    expect(view.result.current?.rows.map(row => row.id)).toEqual([
      "managePin",
      "accessBaanx",
      "help",
      "logout",
    ]);
  });

  it("runs the logout once when the row is pressed twice", async () => {
    const { view, logout, logoutReached, release } = setUp();

    act(() => pressLogoutRow(view.result.current));
    await act(async () => {
      await logoutReached;
    });
    act(() => pressLogoutRow(view.result.current));

    expect(logout).toHaveBeenCalledTimes(1);
    release();
  });

  it("closes the sheet as soon as the logout starts", async () => {
    // The sheet holds the row that started the logout, so it has to leave the screen at the press,
    // not when the request settles.
    const { view, logoutReached, release } = setUp();

    act(() => view.result.current?.onMorePress());
    expect(view.result.current?.isSheetOpen).toBe(true);

    act(() => pressLogoutRow(view.result.current));

    expect(view.result.current?.isSheetOpen).toBe(false);

    await act(async () => {
      await logoutReached;
    });
    release();
  });

  it("shows nothing once the logout is through", async () => {
    const { view, logoutReached, release } = setUp();

    act(() => pressLogoutRow(view.result.current));
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
    // logout would still be raised here, and the row would never act again.
    const { store, view, logoutReached, release } = setUp();
    act(() => pressLogoutRow(view.result.current));
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

    await waitFor(() => expect(view.result.current?.moreLabel).toBe("More"));
    expect(view.result.current?.rows).toHaveLength(4);
  });

  it("forgets an open sheet when the session ends", () => {
    // The component stays mounted, so a sheet left open here would open by itself at the next login.
    const { store, view } = setUp();

    act(() => view.result.current?.onMorePress());
    expect(view.result.current?.isSheetOpen).toBe(true);

    act(() => {
      store.dispatch(setSignedIn(false));
    });
    act(() => {
      store.dispatch(setSignedIn(true));
    });

    expect(view.result.current?.isSheetOpen).toBe(false);
  });
});
