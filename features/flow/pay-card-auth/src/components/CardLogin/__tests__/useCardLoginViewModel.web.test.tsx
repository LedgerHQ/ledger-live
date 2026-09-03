import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { I18nTestProvider } from "@shared/i18n/testing";
import { payCardAuthSlice, setSignedIn } from "../../../state/slice";
import {
  markPayCardLoginIntroSeen,
  payCardLoginIntroSlice,
  resetPayCardLoginIntroSeen,
} from "../../../state/loginIntroSlice";
import { mapSnapshotToViewModel, useCardLoginViewModel } from "../useCardLoginViewModel";
import type { CardLoginCopy, CardLoginIntroViewProps, MobileWallet } from "../types";
import type { CardLoginOauthConfig, CardLoginPorts, HostedLoginResult } from "../../../state/types";
import { CARD_LOGIN_INTRO_RESOURCES } from "./fixtures";

const onLoginPress = jest.fn();

const copy: CardLoginCopy = {
  title: "Crypto Card",
  description: "Log in to access your card",
  loginLabel: "Login",
};

const intro: CardLoginIntroViewProps = {
  isOpen: false,
  title: "Spend crypto, earn cashback",
  providedBy: "Card provided by Baanx",
  rows: [],
  actions: [],
  onActionPress: jest.fn(),
  onClose: jest.fn(),
};

describe("mapSnapshotToViewModel", () => {
  it.each(["idle", "error"] as const)("offers the login action in %s", value => {
    const login = mapSnapshotToViewModel(value, null, copy, onLoginPress, intro);

    expect(login?.isLoading).toBe(false);
    expect(login?.loginLabel).toBe("Login");
  });

  it("shows the copy it was handed", () => {
    const login = mapSnapshotToViewModel("idle", null, copy, onLoginPress, intro);

    expect(login).toMatchObject(copy);
  });

  it.each([
    "hydrating",
    "preparingAttempt",
    "awaitingHostedLogin",
    "validatingCallback",
    "exchangingCode",
    "persistingSession",
    "authenticated",
    "fetchingUser",
    "clearingAttempt",
  ] as const)("shows work in progress in %s", value => {
    expect(mapSnapshotToViewModel(value, null, copy, onLoginPress, intro)?.isLoading).toBe(true);
  });

  it("offers nothing once the card holder is signed in", () => {
    // `CardMore` holds the screen from here, and it reads the same flag to know it.
    expect(mapSnapshotToViewModel("ready", null, copy, onLoginPress, intro)).toBeNull();
  });

  it("shows no message while there is no error", () => {
    expect(
      mapSnapshotToViewModel("idle", null, copy, onLoginPress, intro)?.errorMessage,
    ).toBeNull();
  });

  it("hands the intro props straight through", () => {
    expect(mapSnapshotToViewModel("idle", null, copy, onLoginPress, intro)?.intro).toBe(intro);
  });

  it.each([
    "pkce_failed",
    "browser_open_failed",
    "missing_attempt",
    "exchange_failed",
    "persist_failed",
    "fetch_user_failed",
  ] as const)("shows a message for %s", errorKind => {
    const login = mapSnapshotToViewModel("error", errorKind, copy, onLoginPress, intro);

    expect(login?.errorMessage).toMatch(/\.$/);
    // The copy is ours, never the backend's or RTK's.
    expect(login?.errorMessage).not.toContain(errorKind);
  });
});

const session = { accessToken: "at_token", expiresIn: 21600, refreshToken: "rt_token" };
const user = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" } as const;

const mockPorts: { [K in keyof CardLoginPorts]: jest.Mock } = {
  createAttempt: jest.fn(async () => ({
    codeVerifier: "verifier-value",
    codeChallenge: "challenge-value",
  })),
  saveAttempt: jest.fn(async () => undefined),
  loadAttempt: jest.fn(async () => ({ codeVerifier: "verifier-value" })),
  clearAttempt: jest.fn(async () => undefined),
  hasSession: jest.fn(async () => false),
  persistSession: jest.fn(async () => undefined),
  clearSession: jest.fn(async () => undefined),
  forgetUser: jest.fn(),
  exchangeAuthorizationCode: jest.fn(async () => session),
  getUser: jest.fn(async () => user),
  setSignedIn: jest.fn(),
  openHostedLogin: jest.fn(
    async (): Promise<HostedLoginResult> => ({ type: "dismissed" }) as HostedLoginResult,
  ),
};

jest.mock("../../../state/createCardLoginPorts", () => ({
  createCardLoginPorts: () => mockPorts,
}));

const oauthConfig: CardLoginOauthConfig = {
  apiUrl: "https://card.test",
  clientId: "client-key",
  redirectUri: "https://go.test/ledger/card",
};

function buildStore() {
  return configureStore({
    reducer: {
      payCardAuth: payCardAuthSlice.reducer,
      payCardLoginIntro: payCardLoginIntroSlice.reducer,
    },
  });
}

function withProviders(store: ReturnType<typeof buildStore>) {
  return ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <I18nTestProvider resources={CARD_LOGIN_INTRO_RESOURCES}>{children}</I18nTestProvider>
    </Provider>
  );
}

async function renderIdleLogin(
  store: ReturnType<typeof buildStore>,
  mobileWallet: MobileWallet = "both",
) {
  const rendered = renderHook(
    () =>
      useCardLoginViewModel({
        openHostedLogin: mockPorts.openHostedLogin,
        mobileWallet,
        oauthConfig,
      }),
    { wrapper: withProviders(store) },
  );

  await waitFor(() => expect(rendered.result.current?.isLoading).toBe(false));
  return rendered;
}

const SUCCESS_REDIRECT = "https://go.test/ledger/card?code=authorization-code";

async function completeLogin(
  store: ReturnType<typeof buildStore>,
  result: { current: ReturnType<typeof useCardLoginViewModel> },
) {
  mockPorts.openHostedLogin.mockResolvedValue({ type: "success", url: SUCCESS_REDIRECT });
  mockPorts.loadAttempt.mockResolvedValue({ codeVerifier: "verifier-value" });

  act(() => result.current?.onLoginPress());
  act(() => result.current?.intro.onActionPress());

  await waitFor(() => expect(store.getState().payCardAuth.isSignedIn).toBe(true));
}

describe("useCardLoginViewModel intro", () => {
  let store: ReturnType<typeof buildStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPorts.hasSession.mockResolvedValue(false);
    mockPorts.loadAttempt.mockResolvedValue(null);
    mockPorts.openHostedLogin.mockResolvedValue({ type: "dismissed" });
    store = buildStore();
    mockPorts.setSignedIn.mockImplementation((value: boolean) =>
      store.dispatch(setSignedIn(value)),
    );
  });

  it("resolves the copy from the app's own translation keys", async () => {
    const { result } = await renderIdleLogin(store);

    expect(result.current?.intro.title).toBe("Spend crypto, earn cashback");
    expect(result.current?.intro.providedBy).toBe("Card provided by Baanx");
    expect(result.current?.intro.rows.map(row => row.title)).toEqual([
      "Uncapped 1% crypto cashback",
      "Free virtual card",
      "Securely top up via Ledger Wallet",
    ]);
  });

  it("sells the card while the intro has not been seen", async () => {
    const { result } = await renderIdleLogin(store);

    expect(result.current?.title).toBe("Crypto Card");
    expect(result.current?.description).toBe("Get 1% cashback every time you spend");
    expect(result.current?.loginLabel).toBe("Get card");
  });

  it("offers a login once the intro has been seen", async () => {
    store.dispatch(markPayCardLoginIntroSeen());
    const { result } = await renderIdleLogin(store);

    expect(result.current?.title).toBe("Crypto Card");
    expect(result.current?.description).toBe("Log in to access your card");
    expect(result.current?.loginLabel).toBe("Login");
  });

  it.each([
    ["applePay", "Add to Apple Pay, ready instantly."],
    ["googlePay", "Add to Google Pay, ready instantly."],
    ["both", "Add to Apple Pay or Google Pay, ready instantly."],
  ] as const)("names the %s wallet of the host it runs on", async (mobileWallet, description) => {
    const { result } = await renderIdleLogin(store, mobileWallet);

    expect(result.current?.intro.rows[1].description).toBe(description);
  });

  it("offers two actions, the base one first", async () => {
    const { result } = await renderIdleLogin(store);

    expect(result.current?.intro.actions).toEqual([
      { id: "createAccount", label: "Create an account", appearance: "base" },
      { id: "logIn", label: "Log in to Baanx", appearance: "gray" },
    ]);
  });

  it("opens the intro on the first login press, and starts no login", async () => {
    const { result } = await renderIdleLogin(store);

    expect(result.current?.intro.isOpen).toBe(false);

    act(() => result.current?.onLoginPress());

    expect(result.current?.intro.isOpen).toBe(true);
    expect(mockPorts.openHostedLogin).not.toHaveBeenCalled();
  });

  it("starts the login straight away once the intro has been seen", async () => {
    store.dispatch(markPayCardLoginIntroSeen());
    const { result } = await renderIdleLogin(store);

    act(() => result.current?.onLoginPress());

    await waitFor(() => expect(mockPorts.openHostedLogin).toHaveBeenCalledTimes(1));
    expect(result.current?.intro.isOpen).toBe(false);
  });

  it("closes the intro and starts the login from an action press", async () => {
    const { result } = await renderIdleLogin(store);

    act(() => result.current?.onLoginPress());
    act(() => result.current?.intro.onActionPress());

    await waitFor(() => expect(mockPorts.openHostedLogin).toHaveBeenCalledTimes(1));
    expect(result.current?.intro.isOpen).toBe(false);
  });

  it("drops a second action press, so one press starts one login", async () => {
    const { result } = await renderIdleLogin(store);

    act(() => result.current?.onLoginPress());
    act(() => result.current?.intro.onActionPress());
    act(() => result.current?.intro.onActionPress());

    await waitFor(() => expect(mockPorts.openHostedLogin).toHaveBeenCalledTimes(1));
    expect(mockPorts.createAttempt).toHaveBeenCalledTimes(1);
  });

  it("closing the intro starts no login and leaves the flag down", async () => {
    const { result } = await renderIdleLogin(store);

    act(() => result.current?.onLoginPress());
    act(() => result.current?.intro.onClose());

    expect(result.current?.intro.isOpen).toBe(false);
    expect(mockPorts.openHostedLogin).not.toHaveBeenCalled();
    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);
    act(() => result.current?.onLoginPress());
    expect(result.current?.intro.isOpen).toBe(true);
  });

  it("marks the intro seen once a login this session completes", async () => {
    const { result } = await renderIdleLogin(store);
    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);

    await completeLogin(store, result);

    expect(mockPorts.exchangeAuthorizationCode).toHaveBeenCalledWith({
      code: "authorization-code",
      codeVerifier: "verifier-value",
    });
    expect(mockPorts.persistSession).toHaveBeenCalledWith(session);
    expect(mockPorts.getUser).toHaveBeenCalledTimes(1);
    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(true);
  });

  it("leaves the intro unseen when a stored session is hydrated at mount", async () => {
    mockPorts.hasSession.mockResolvedValue(true);

    renderHook(
      () =>
        useCardLoginViewModel({
          openHostedLogin: mockPorts.openHostedLogin,
          mobileWallet: "both",
          oauthConfig,
        }),
      { wrapper: withProviders(store) },
    );

    await waitFor(() => expect(mockPorts.setSignedIn).toHaveBeenCalledWith(true));
    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);
  });

  it("keeps the flag down after a devtool reset while the machine sits in ready", async () => {
    const { result } = await renderIdleLogin(store);
    await completeLogin(store, result);
    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(true);

    await act(async () => {
      store.dispatch(resetPayCardLoginIntroSeen());
    });

    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);
  });

  it("leaves the intro unseen when the hosted login is dismissed", async () => {
    const { result } = await renderIdleLogin(store);

    act(() => result.current?.onLoginPress());
    act(() => result.current?.intro.onActionPress());

    await waitFor(() => expect(result.current?.isLoading).toBe(false));
    expect(store.getState().payCardLoginIntro.hasSeenLoginIntro).toBe(false);
  });
});
