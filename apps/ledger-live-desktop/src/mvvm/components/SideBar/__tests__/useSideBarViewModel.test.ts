import { renderHook, act } from "tests/testSetup";
import { useNavigate } from "react-router";
import { useSideBarViewModel } from "../useSideBarViewModel";
import { SIDEBAR_VALUE_TO_PATH, SIDEBAR_VALUE_TO_TRACK_ENTRY } from "../utils/constants";
import * as segment from "~/renderer/analytics/segment";
import type { SideBarViewModel } from "../types";
import { defaultInitialState, withFeatureFlags } from "./testUtils";
import { isSideBarNavValue } from "../utils";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("~/renderer/screens/card/CardPlatformApp", () => ({
  BAANX_APP_ID: "cl-card",
}));

const mockedUseNavigate = jest.mocked(useNavigate);

function renderViewModel(initialState = defaultInitialState) {
  return renderHook(() => useSideBarViewModel(), { initialState, minimal: false });
}

type NavHandlerName = NonNullable<
  {
    [K in keyof SideBarViewModel]: SideBarViewModel[K] extends () => void ? K : never;
  }[keyof SideBarViewModel]
>;

const NAV_HANDLER_CASES: ReadonlyArray<{
  handler: NavHandlerName;
  path: string;
  trackEntry: string;
}> = [
  { handler: "handleClickAccounts", path: SIDEBAR_VALUE_TO_PATH.accounts, trackEntry: "accounts" },
  { handler: "handleClickSwap", path: SIDEBAR_VALUE_TO_PATH.swap, trackEntry: "swap" },
  { handler: "handleClickEarn", path: SIDEBAR_VALUE_TO_PATH.earn, trackEntry: "earn" },
  { handler: "handleClickCatalog", path: SIDEBAR_VALUE_TO_PATH.discover, trackEntry: "platform" },
  { handler: "handleClickCardWallet", path: SIDEBAR_VALUE_TO_PATH.card, trackEntry: "card" },
  { handler: "handleClickMarket", path: "/market", trackEntry: "market" },
  { handler: "handleClickManager", path: "/manager", trackEntry: "manager" },
  { handler: "handleClickExchange", path: "/exchange", trackEntry: "exchange" },
  { handler: "handleClickPerps", path: "/perps", trackEntry: "perps" },
  { handler: "handleClickCard", path: "/card", trackEntry: "card" },
];

const ACTIVE_CHANGE_NAV_CASES = Object.keys(SIDEBAR_VALUE_TO_PATH)
  .filter(isSideBarNavValue)
  .filter(value => value !== "home")
  .map(value => ({
    value,
    path: SIDEBAR_VALUE_TO_PATH[value],
    trackEntry: SIDEBAR_VALUE_TO_TRACK_ENTRY[value],
  }));

describe("useSideBarViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it("should return correct default state", () => {
    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      collapsed: false,
      noAccounts: true,
      totalStarredAccounts: 0,
      active: "home",
    });
  });

  describe("collapse", () => {
    it("should toggle collapsed via handleCollapse", () => {
      const { result } = renderViewModel();

      act(() => result.current.handleCollapse());
      expect(result.current.collapsed).toBe(true);

      act(() => result.current.handleCollapse());
      expect(result.current.collapsed).toBe(false);
    });

    it("should set collapsed explicitly via handleCollapsedChange", () => {
      const { result } = renderViewModel();

      act(() => result.current.handleCollapsedChange(true));
      expect(result.current.collapsed).toBe(true);
    });
  });

  describe("navigation handlers", () => {
    it.each(NAV_HANDLER_CASES)(
      "should navigate to $path and track '$trackEntry' via $handler",
      ({ handler, path, trackEntry }) => {
        const trackSpy = jest.spyOn(segment, "track");
        const { result } = renderViewModel();

        act(() => {
          result.current[handler]();
        });

        expect(mockNavigate).toHaveBeenCalledWith(path);
        expect(trackSpy).toHaveBeenCalledWith("menuentry_clicked", {
          entry: trackEntry,
          page: "/",
          flagged: false,
        });

        trackSpy.mockRestore();
      },
    );

    it("should skip navigation when already on target path", () => {
      const { result } = renderViewModel();

      act(() => result.current.handleClickDashboard());

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("handleClickRefer", () => {
    it("should navigate when referral program is enabled with path", () => {
      const { result } = renderViewModel(
        withFeatureFlags({
          referralProgramDesktopSidebar: {
            enabled: true,
            params: { path: "/refer-a-friend", isNew: false },
          },
        }),
      );

      act(() => result.current.handleClickRefer());

      expect(mockNavigate).toHaveBeenCalledWith("/refer-a-friend");
    });

    it("should not navigate when referral program is disabled", () => {
      const { result } = renderViewModel();

      act(() => result.current.handleClickRefer());

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("handleClickRecover", () => {
    it("should open modal and track when enabled without openRecoverFromSidebar", () => {
      const trackSpy = jest.spyOn(segment, "track");
      const { result } = renderViewModel(
        withFeatureFlags({ protectServicesDesktop: { enabled: true } }),
      );

      act(() => result.current.handleClickRecover());

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(trackSpy).toHaveBeenCalledWith("button_clicked2", { button: "Protect" });
      trackSpy.mockRestore();
    });

    it("should only track when feature is not enabled", () => {
      const trackSpy = jest.spyOn(segment, "track");
      const { result } = renderViewModel();

      act(() => result.current.handleClickRecover());

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(trackSpy).toHaveBeenCalledWith("button_clicked2", { button: "Protect" });
      trackSpy.mockRestore();
    });
  });

  describe("handleActiveChange", () => {
    it.each(ACTIVE_CHANGE_NAV_CASES)(
      'should navigate to $path and track "$trackEntry" for value "$value"',
      ({ value, path, trackEntry }) => {
        const trackSpy = jest.spyOn(segment, "track");
        const { result } = renderViewModel();

        act(() => result.current.handleActiveChange(value));

        expect(mockNavigate).toHaveBeenCalledWith(path);
        expect(trackSpy).toHaveBeenCalledWith("menuentry_clicked", {
          entry: trackEntry,
          page: "/",
          flagged: false,
        });

        trackSpy.mockRestore();
      },
    );

    it("should delegate to handleClickRefer for 'refer'", () => {
      const { result } = renderViewModel(
        withFeatureFlags({
          referralProgramDesktopSidebar: { enabled: true, params: { path: "/refer-a-friend" } },
        }),
      );

      act(() => result.current.handleActiveChange("refer"));

      expect(mockNavigate).toHaveBeenCalledWith("/refer-a-friend");
    });

    it("should delegate to handleClickRecover for 'recover'", () => {
      const trackSpy = jest.spyOn(segment, "track");
      const { result } = renderViewModel(
        withFeatureFlags({ protectServicesDesktop: { enabled: true } }),
      );

      act(() => result.current.handleActiveChange("recover"));

      expect(trackSpy).toHaveBeenCalledWith("button_clicked2", { button: "Protect" });
      trackSpy.mockRestore();
    });

    it("should ignore unknown values", () => {
      const { result } = renderViewModel();

      act(() => result.current.handleActiveChange("unknown-value"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
