import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthSection } from "./AuthSection";
import type { PayCardAuthProps, PayCardMockSessionProps } from "../types";

const SESSION = { accessToken: "at_fake_access_token", refreshToken: "rt_fake_refresh_token" };

type AuthOverrides = Partial<Omit<PayCardAuthProps, "mockSession">> & {
  mockSession?: Partial<PayCardMockSessionProps>;
};

function buildAuth(overrides: AuthOverrides = {}): PayCardAuthProps {
  return {
    session: null,
    sessionError: null,
    busy: false,
    lastResult: null,
    readTokens: jest.fn(),
    renewNow: jest.fn(),
    breakAccessToken: jest.fn(),
    breakRefreshToken: jest.fn(),
    clearSession: jest.fn(),
    signOut: jest.fn(),
    fetchUser: jest.fn(),
    mock: {
      available: false,
      response: "pass",
      responses: [],
      setResponse: jest.fn(),
      renewals: 0,
      resetRenewals: jest.fn(),
      armUnauthorized: jest.fn(),
    },
    ...overrides,
    mockSession: {
      available: false,
      signIn: jest.fn(),
      ...overrides.mockSession,
    },
  };
}

describe("AuthSection (web)", () => {
  it("should show the stored token masked, so the screen never carries a whole one", () => {
    render(<AuthSection auth={buildAuth({ session: SESSION })} />);

    expect(screen.getByText("Signed in")).toBeVisible();
    expect(screen.getByText("access at_fake_a…")).toBeVisible();
    expect(screen.queryByText(SESSION.accessToken)).not.toBeInTheDocument();
  });

  it("should show why the session store refused a read", () => {
    render(<AuthSection auth={buildAuth({ sessionError: "the store is unreadable" })} />);

    expect(screen.getByText("Unreadable")).toBeVisible();
    expect(screen.getByText("the store is unreadable")).toBeVisible();
  });

  it("should sign a mock session in while the mock answers the Card endpoints", async () => {
    const user = userEvent.setup();
    const signIn = jest.fn();
    render(<AuthSection auth={buildAuth({ mockSession: { available: true, signIn } })} />);

    await user.click(screen.getByText("Sign in with a mock session"));

    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it("should refuse a mock sign in while nothing intercepts the Card endpoints", async () => {
    const user = userEvent.setup();
    const auth = buildAuth();
    render(<AuthSection auth={auth} />);

    await user.click(screen.getByText("Sign in with a mock session"));

    expect(auth.mockSession.signIn).not.toHaveBeenCalled();
    expect(
      screen.getByText("Start with `pnpm desktop start:msw` to sign in without the provider."),
    ).toBeVisible();
  });

  it("should sign out the session it holds", async () => {
    const user = userEvent.setup();
    const signOut = jest.fn();
    render(<AuthSection auth={buildAuth({ session: SESSION, signOut })} />);

    await user.click(screen.getByText("Sign out current session"));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("should refuse a sign out with no session to end", async () => {
    const user = userEvent.setup();
    const auth = buildAuth();
    render(<AuthSection auth={auth} />);

    await user.click(screen.getByText("Sign out current session"));

    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("should ask the user endpoint, so a session can be checked against what answers it", async () => {
    const user = userEvent.setup();
    const auth = buildAuth({ session: SESSION, mockSession: { available: true } });
    render(<AuthSection auth={auth} />);

    await user.click(screen.getByText("[MSW] Get user"));

    expect(auth.fetchUser).toHaveBeenCalledTimes(1);
  });

  it("should report what the last action answered", () => {
    render(
      <AuthSection
        auth={buildAuth({ lastResult: { id: 1, message: "mock sign in → done", failed: false } })}
      />,
    );

    expect(screen.getByText("mock sign in → done")).toBeVisible();
  });
});
