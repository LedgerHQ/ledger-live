import { render, screen, userEvent } from "@support/jest-devtools/native";
import { AuthSection } from "./AuthSection";
import type { PayCardAuthProps, PayCardMockResponse, PayCardRenewalMockProps } from "../types";

const RESPONSES: readonly PayCardMockResponse[] = [
  { id: "pass", label: "Off", hint: "The mock stands aside." },
  { id: "400", label: "400", hint: "A refresh token the provider will not accept again." },
];

const SESSION = { accessToken: "at_fake_access_token", refreshToken: "rt_fake_refresh_token" };

type AuthOverrides = Partial<Omit<PayCardAuthProps, "mock">> & {
  mock?: Partial<PayCardRenewalMockProps>;
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
    fetchUser: jest.fn(),
    ...overrides,
    mock: {
      available: false,
      response: "pass",
      responses: [],
      setResponse: jest.fn(),
      renewals: 0,
      resetRenewals: jest.fn(),
      armUnauthorized: jest.fn(),
      ...overrides.mock,
    },
  };
}

describe("AuthSection (native)", () => {
  describe("the session status", () => {
    it("should show the stored tokens masked, so the screen never carries a whole one", () => {
      render(<AuthSection auth={buildAuth({ session: SESSION })} />);

      expect(screen.getByText("Live")).toBeTruthy();
      expect(screen.getByText("at_fake_a…")).toBeTruthy();
      expect(screen.getByText("rt_fake_r…")).toBeTruthy();
      expect(screen.queryByText(SESSION.accessToken)).toBeNull();
      expect(screen.queryByText(SESSION.refreshToken)).toBeNull();
    });

    it("should show why the secure store refused a read", () => {
      render(<AuthSection auth={buildAuth({ sessionError: "the keychain is locked" })} />);

      expect(screen.getByText("Unreadable")).toBeTruthy();
      expect(screen.getByText("the keychain is locked")).toBeTruthy();
      expect(screen.queryByText("Live")).toBeNull();
    });

    it("should send the tester to the Pay tab when there is no session to read", async () => {
      const user = userEvent.setup();
      const openPayTab = jest.fn();
      render(<AuthSection auth={buildAuth({ openPayTab })} />);

      expect(screen.getByText("No session")).toBeTruthy();
      expect(screen.getByText("Sign in to the Pay tab first.")).toBeTruthy();
      await user.press(screen.getByText("Go to the Pay tab"));

      expect(openPayTab).toHaveBeenCalledTimes(1);
    });

    it("should hide the Pay tab button on a host that cannot navigate", () => {
      render(<AuthSection auth={buildAuth()} />);

      expect(screen.queryByText("Go to the Pay tab")).toBeNull();
    });

    it("should hide the Pay tab button while the store is unreadable", () => {
      render(<AuthSection auth={buildAuth({ sessionError: "denied", openPayTab: jest.fn() })} />);

      expect(screen.queryByText("Go to the Pay tab")).toBeNull();
    });
  });

  describe("the device secure storage actions", () => {
    it("should wire every keychain action", async () => {
      const user = userEvent.setup();
      const auth = buildAuth({ session: SESSION });
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

    it("should refuse a second action while one is still running", async () => {
      const user = userEvent.setup();
      const auth = buildAuth({ busy: true });
      render(<AuthSection auth={auth} />);

      await user.press(screen.getByText("Get auth tokens"));
      await user.press(screen.getByText("Clear session"));

      expect(auth.readTokens).not.toHaveBeenCalled();
      expect(auth.clearSession).not.toHaveBeenCalled();
    });
  });

  describe("the API requests", () => {
    it("should wire the renewal and the user request", async () => {
      const user = userEvent.setup();
      const auth = buildAuth();
      render(<AuthSection auth={auth} />);

      await user.press(screen.getByText("Renew now"));
      await user.press(screen.getByText("Get user"));

      expect(auth.renewNow).toHaveBeenCalledTimes(1);
      expect(auth.fetchUser).toHaveBeenCalledTimes(1);
    });

    it("should mark the requests the mock answers, so a real call is never mistaken", () => {
      render(<AuthSection auth={buildAuth({ mock: { available: true } })} />);

      expect(screen.getByText("[MSW] Renew now")).toBeTruthy();
      expect(screen.getByText("[MSW] Get user")).toBeTruthy();
    });
  });

  describe("the renewal mock", () => {
    it("should say the mock is off and how to start it", () => {
      render(<AuthSection auth={buildAuth()} />);

      expect(screen.getByText("MSW off")).toBeTruthy();
      expect(
        screen.getByText("Start with `pnpm mobile start:msw` to choose what the provider answers."),
      ).toBeTruthy();
      expect(screen.queryByText("What POST /v1/auth/oauth2/token answers:")).toBeNull();
    });

    it("should list every answer and set the one the tester chose", async () => {
      const user = userEvent.setup();
      const setResponse = jest.fn();
      const auth = buildAuth({
        mock: { available: true, response: "pass", responses: RESPONSES, setResponse },
      });
      render(<AuthSection auth={auth} />);

      expect(screen.getByText("MSW running")).toBeTruthy();
      expect(screen.getByText("What POST /v1/auth/oauth2/token answers:")).toBeTruthy();
      expect(screen.getByText("The mock stands aside.")).toBeTruthy();
      await user.press(screen.getByText("400"));

      expect(setResponse).toHaveBeenCalledWith("400");
    });

    it("should show no hint when the chosen answer is not one it offers", () => {
      render(
        <AuthSection
          auth={buildAuth({
            mock: { available: true, response: "unknown", responses: RESPONSES },
          })}
        />,
      );

      expect(screen.queryByText("The mock stands aside.")).toBeNull();
    });

    it("should count the renewals it answered", () => {
      render(<AuthSection auth={buildAuth({ mock: { available: true, renewals: 4 } })} />);

      expect(screen.getByText("renewals 4")).toBeTruthy();
    });

    it("should wire the renewal count reset and the 401 arming", async () => {
      const user = userEvent.setup();
      const resetRenewals = jest.fn();
      const armUnauthorized = jest.fn();
      const auth = buildAuth({
        mock: { available: true, resetRenewals, armUnauthorized },
      });
      render(<AuthSection auth={auth} />);

      await user.press(screen.getByText("Reset renewals"));
      await user.press(screen.getByText("Next user call → 401"));

      expect(resetRenewals).toHaveBeenCalledTimes(1);
      expect(armUnauthorized).toHaveBeenCalledTimes(1);
    });

    it("should refuse the mock controls while the mock is not running", async () => {
      const user = userEvent.setup();
      const auth = buildAuth();
      render(<AuthSection auth={auth} />);

      await user.press(screen.getByText("Reset renewals"));
      await user.press(screen.getByText("Next user call → 401"));

      expect(auth.mock.resetRenewals).not.toHaveBeenCalled();
      expect(auth.mock.armUnauthorized).not.toHaveBeenCalled();
    });
  });
});
