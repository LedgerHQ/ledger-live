import React from "react";
import { MemoryRouter } from "react-router";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { readCardUsEnv } from "@features/platform-card";
import { getEnvDefault, setEnv } from "@shared/env";
import { act, renderHook } from "tests/testSetup";
import { useCardViewModel } from "../useCardViewModel";

const mockNavigate = jest.fn();
const mockOpenURL = jest.fn();

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

jest.mock("~/renderer/linking", () => ({
  openURL: (...args: unknown[]) => mockOpenURL(...args),
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
    mockOpenURL.mockClear();
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

  it("pre-selects the asset the user topped up from", async () => {
    const { result } = renderCardViewModel(null);

    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      result.current.assets?.onTopUp?.({ currency: "btc" } as CardAssetRow);
    });

    expect(topUpUrlFrom(mockNavigate)).toBe("https://ledger.baanxapi.test/topup?currency=btc");
  });

  it("opens card history with a back path to Pay", () => {
    const { result } = renderCardViewModel(null);

    act(() => result.current.onShowMore());

    expect(mockNavigate).toHaveBeenCalledWith("/history?tab=card", {
      state: { historyBackPath: "/paytab" },
    });
  });

  it("opens card history scoped to the selected asset", () => {
    const { result } = renderCardViewModel(null);

    act(() =>
      result.current.assets?.onShowHistory?.({
        id: "wallet-usdc",
        currency: "usdc",
        network: "ethereum",
        name: "USD Coin",
        ticker: "USDC",
        ledgerId: "ethereum/erc20/usd__coin",
        cryptoAmount: "125 USDC",
        countervalue: "$125.00",
        countervalueAmount: 125,
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith("/history?tab=card&asset=usdc", {
      state: { historyBackPath: "/paytab" },
    });
  });

  it("opens the manage PIN hosted page on the hosted manifest", async () => {
    const { result } = renderCardViewModel(null);

    await act(async () => result.current.cardSettingsActions?.onManagePin?.());

    expect(topUpUrlFrom(mockNavigate)).toBe("https://ledger.baanxapi.test/dashboard/card/details");
  });

  it("opens the access Baanx hosted page on the hosted manifest", async () => {
    const { result } = renderCardViewModel(null);

    await act(async () => result.current.cardSettingsActions?.onAccessBaanx?.());

    expect(topUpUrlFrom(mockNavigate)).toBe("https://ledger.baanxapi.test/");
  });

  it("names the US app on the access Baanx hosted page for a US card holder", async () => {
    setEnv("CARD_BAANX_US_APP_ID", "LEDGERUS");
    mockedReadCardUsEnv.mockResolvedValue(true);
    const { result } = renderCardViewModel(null);

    await act(async () => result.current.cardSettingsActions?.onAccessBaanx?.());

    expect(topUpUrlFrom(mockNavigate)).toBe("https://ledger.baanxapi.test/?app_id=LEDGERUS");
  });

  it("opens the card help center article externally", () => {
    const { result } = renderCardViewModel(null);

    act(() => result.current.cardSettingsActions?.onHelp?.());

    expect(mockOpenURL).toHaveBeenCalledWith("https://support.ledger.com/article/5283612250653-zd");
  });

  it("keeps the same cardSettingsActions reference across re-renders", () => {
    const { result, rerender } = renderCardViewModel(null);

    const first = result.current.cardSettingsActions;
    rerender();

    expect(result.current.cardSettingsActions).toBe(first);
  });
});
