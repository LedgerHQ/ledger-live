import React from "react";
import { MemoryRouter } from "react-router";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { readCardUsEnv } from "@features/platform-card";
import { getEnvDefault, setEnv } from "@shared/env";
import { act, renderHook } from "tests/testSetup";
import { useCardViewModel } from "../useCardViewModel";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@ledgerhq/live-common/wallet-api/useLiveAppManifest", () => ({
  useLiveAppManifest: jest.fn(),
}));

jest.mock("@features/platform-card", () => ({
  ...jest.requireActual("@features/platform-card"),
  readCardUsEnv: jest.fn(),
}));

const HOSTED_MANIFEST = { id: "baanx-hosted-url", url: "https://ledger.baanxapi.test" };

const mockedManifest = jest.mocked(useLiveAppManifest);
const mockedReadCardUsEnv = jest.mocked(readCardUsEnv);

function topUpUrlFrom(navigateMock: jest.Mock): string {
  const [, options] = navigateMock.mock.calls[0];
  return (options as { state: { goToURL: string } }).state.goToURL;
}

// The harness router takes a path only, and this view model reads router state.
function atPayTabWith(state: unknown) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[{ pathname: "/paytab", state }]}>{children}</MemoryRouter>
    );
  };
}

function renderCardViewModel(state: unknown) {
  return renderHook(() => useCardViewModel(), {
    skipRouter: true,
    wrapper: atPayTabWith(state),
  });
}

describe("useCardViewModel", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockedReadCardUsEnv.mockResolvedValue(false);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockedManifest.mockReturnValue(HOSTED_MANIFEST as ReturnType<typeof useLiveAppManifest>);
  });

  afterEach(() => {
    setEnv("CARD_BAANX_US_APP_ID", getEnvDefault("CARD_BAANX_US_APP_ID"));
  });

  it("hands the Card login the code the deep link brought", () => {
    const { result } = renderCardViewModel({ code: "auth-code" });

    expect(result.current.login.callback).toEqual({ code: "auth-code" });
    expect(mockNavigate).toHaveBeenCalledWith("/paytab", { replace: true, state: null });
  });

  it("hands it the attempt state alongside the code, when the deep link carried one", () => {
    const { result } = renderCardViewModel({ code: "auth-code", state: "attempt-state" });

    expect(result.current.login.callback).toEqual({ code: "auth-code", state: "attempt-state" });
    expect(mockNavigate).toHaveBeenCalledWith("/paytab", { replace: true, state: null });
  });

  it("hands it the provider app id alongside the code, when the deep link carried one", () => {
    const { result } = renderCardViewModel({ code: "auth-code", appId: "app-value" });

    expect(result.current.login.callback).toEqual({ code: "auth-code", appId: "app-value" });
    expect(mockNavigate).toHaveBeenCalledWith("/paytab", { replace: true, state: null });
  });

  it("hands it no callback when the deep link brought no code", () => {
    const { result } = renderCardViewModel(null);

    expect(result.current.login.callback).toBeNull();
  });

  it.each([{ code: "" }, { code: 42 }, { other: "value" }])(
    "hands it no callback for the state %p",
    state => {
      const { result } = renderCardViewModel(state);

      expect(result.current.login.callback).toBeNull();
    },
  );

  it("clears the router state once the callback has been read, so a later remount cannot replay it", () => {
    renderCardViewModel({ code: "auth-code" });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/paytab", { replace: true, state: null });
  });

  it("leaves the router state alone when there is nothing to clear", () => {
    renderCardViewModel(null);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("opens the top up page on the hosted manifest", async () => {
    const { result } = renderCardViewModel(null);

    await act(async () => {
      await result.current.onTopUp();
    });

    expect(topUpUrlFrom(mockNavigate)).toBe("https://ledger.baanxapi.test/topup");
  });

  it("names the US app on the top up page for a US card holder", async () => {
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    const { result } = renderCardViewModel(null);

    await act(async () => {
      await result.current.onTopUp();
    });

    expect(topUpUrlFrom(mockNavigate)).toBe("https://ledger.baanxapi.test/topup?app_id=LEDGERUS");
  });
  it("opens card history with a back path to Pay", () => {
    const { result } = renderCardViewModel(null);

    act(() => result.current.onShowMore());

    expect(mockNavigate).toHaveBeenCalledWith("/history?tab=card", {
      state: { historyBackPath: "/paytab" },
    });
  });
});
