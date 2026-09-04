import { render, screen, userEvent } from "@support/jest-devtools/native";
import { AuthSection } from "./AuthSection";
import type { PayCardAuthProps } from "../types";

function buildAuth(overrides: Partial<PayCardAuthProps> = {}): PayCardAuthProps {
  return {
    session: {
      accessToken: "at_a_very_long_access_token",
      refreshToken: "rt_a_very_long_refresh_token",
    },
    sessionError: null,
    busy: false,
    lastResult: null,
    readTokens: jest.fn(),
    renewNow: jest.fn(),
    breakAccessToken: jest.fn(),
    breakRefreshToken: jest.fn(),
    clearSession: jest.fn(),
    fetchUser: jest.fn(),
    mock: {
      available: true,
      response: "pass",
      responses: [
        { id: "pass", label: "Off", hint: "The real provider answers." },
        { id: "200", label: "200", hint: "The session renews." },
        { id: "400", label: "400", hint: "The session must end." },
      ],
      setResponse: jest.fn(),
      renewals: 0,
      resetRenewals: jest.fn(),
      armUnauthorized: jest.fn(),
      ...overrides.mock,
    },
    ...overrides,
  };
}

describe("AuthSection (native)", () => {
  it("renders every section", () => {
    render(<AuthSection auth={buildAuth()} />);

    expect(screen.getByText("Auth session")).toBeTruthy();
    expect(screen.getByText("Device secure storage")).toBeTruthy();
    expect(screen.getByText("Send API requests")).toBeTruthy();
    expect(screen.getByText("MSW Auth Renewal Mock")).toBeTruthy();
  });

  it("shows a live session, masked", () => {
    render(<AuthSection auth={buildAuth()} />);

    expect(screen.getByText("Live")).toBeTruthy();
    expect(screen.getByText("access")).toBeTruthy();
    expect(screen.getByText("refresh")).toBeTruthy();
    expect(screen.getByText("at_a_very…")).toBeTruthy();
    expect(screen.getByText("rt_a_very…")).toBeTruthy();
    expect(screen.queryByText("at_a_very_long_access_token")).toBeNull();
  });

  it("never shows a short token in full", () => {
    render(
      <AuthSection
        auth={buildAuth({
          session: { accessToken: "short", refreshToken: "x" },
        })}
      />,
    );

    expect(screen.getByText("shor…")).toBeTruthy();
    expect(screen.getByText("…")).toBeTruthy();
    expect(screen.queryByText("short")).toBeNull();
    expect(screen.queryByText("x")).toBeNull();
  });

  it("invites a login when nothing is stored", () => {
    render(<AuthSection auth={buildAuth({ session: null })} />);

    expect(screen.getByText("No session")).toBeTruthy();
    expect(screen.getByText("Sign in to the Pay tab first.")).toBeTruthy();
  });

  it("offers a shortcut to the Pay tab when nothing is stored", async () => {
    const user = userEvent.setup();
    const openPayTab = jest.fn();
    render(<AuthSection auth={buildAuth({ session: null, openPayTab })} />);

    await user.press(screen.getByText("Go to the Pay tab"));
    expect(openPayTab).toHaveBeenCalledTimes(1);
  });

  it("hides the shortcut once a session exists", () => {
    render(<AuthSection auth={buildAuth({ openPayTab: jest.fn() })} />);

    expect(screen.queryByText("Go to the Pay tab")).toBeNull();
  });

  it("hides the shortcut on a host that cannot navigate", () => {
    render(<AuthSection auth={buildAuth({ session: null })} />);

    expect(screen.queryByText("Go to the Pay tab")).toBeNull();
  });

  it("wires the keychain actions", async () => {
    const user = userEvent.setup();
    const auth = buildAuth();
    render(<AuthSection auth={auth} />);

    await user.press(screen.getByText("Get auth tokens"));
    await user.press(screen.getByText("Break access token"));
    await user.press(screen.getByText("Break refresh token"));
    await user.press(screen.getByText("Clear session"));

    expect(auth.readTokens).toHaveBeenCalledTimes(1);
    expect(auth.breakAccessToken).toHaveBeenCalledTimes(1);
    expect(auth.breakRefreshToken).toHaveBeenCalledTimes(1);
    expect(auth.clearSession).toHaveBeenCalledTimes(1);
  });

  it("wires the request actions", async () => {
    const user = userEvent.setup();
    const auth = buildAuth();
    render(<AuthSection auth={auth} />);

    await user.press(screen.getByText("[MSW] Renew now"));
    await user.press(screen.getByText("[MSW] Get user"));

    expect(auth.renewNow).toHaveBeenCalledTimes(1);
    expect(auth.fetchUser).toHaveBeenCalledTimes(1);
  });

  it("marks the request buttons while the mock answers them", () => {
    render(<AuthSection auth={buildAuth()} />);

    expect(screen.getByText("[MSW] Get user")).toBeTruthy();
    expect(screen.getByText("Get auth tokens")).toBeTruthy();
  });

  it("leaves the request buttons unmarked when the real provider answers", () => {
    const auth = buildAuth();
    render(
      <AuthSection auth={{ ...auth, mock: { ...auth.mock, available: false, responses: [] } }} />,
    );

    expect(screen.getByText("Get user")).toBeTruthy();
    expect(screen.queryByText("[MSW] Get user")).toBeNull();
  });

  it("names the endpoint it steers, and lists one button per documented answer", () => {
    render(<AuthSection auth={buildAuth()} />);

    expect(screen.getByText("MSW running")).toBeTruthy();
    expect(screen.getByText("renewals 0")).toBeTruthy();
    expect(screen.getByText("What POST /v1/auth/oauth2/token answers:")).toBeTruthy();
    expect(screen.getByText("Off")).toBeTruthy();
    expect(screen.getByText("200")).toBeTruthy();
    expect(screen.getByText("400")).toBeTruthy();
  });

  it("switches to another answer by its status code", async () => {
    const user = userEvent.setup();
    const auth = buildAuth();
    render(<AuthSection auth={auth} />);

    await user.press(screen.getByText("400"));
    expect(auth.mock.setResponse).toHaveBeenCalledWith("400");
  });

  it("explains the chosen answer, so a status code is never bare", () => {
    const auth = buildAuth();
    render(<AuthSection auth={{ ...auth, mock: { ...auth.mock, response: "400" } }} />);

    expect(screen.getByText("The session must end.")).toBeTruthy();
    expect(screen.queryByText("The session renews.")).toBeNull();
  });

  it("says how to start the mock when it is not running", () => {
    const auth = buildAuth({
      mock: { ...buildAuth().mock, available: false, responses: [] },
    });
    render(<AuthSection auth={auth} />);

    expect(screen.getByText("MSW off")).toBeTruthy();
    expect(screen.queryByText("200")).toBeNull();
    expect(screen.queryByText("What POST /v1/auth/oauth2/token answers:")).toBeNull();
  });

  it("reports a store it could not read apart from an empty one", () => {
    render(
      <AuthSection auth={buildAuth({ session: null, sessionError: "The keychain is locked" })} />,
    );

    expect(screen.getByText("Unreadable")).toBeTruthy();
    expect(screen.getByText("The keychain is locked")).toBeTruthy();
    expect(screen.queryByText("No session")).toBeNull();
  });
});
