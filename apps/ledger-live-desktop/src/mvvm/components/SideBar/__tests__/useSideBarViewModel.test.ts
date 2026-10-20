import { renderHook, act } from "tests/testSetup";
import { useNavigate } from "react-router";
import { useSideBarViewModel } from "../useSideBarViewModel";
import { SIDEBAR_VALUE_TO_PATH, SIDEBAR_VALUE_TO_TRACK_ENTRY } from "../utils/constants";
import { SCROLL_TO_TOP_EVENT } from "LLD/components/Page/constants";
import * as analytics from "@shared/analytics";
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

const ACTIVE_CHANGE_NAV_CASES = Object.keys(SIDEBAR_VALUE_TO_PATH)
  .filter(isSideBarNavValue)
  .filter(value => value !== "home" && value !== "accounts")
  .map(value => ({
    value,
    path: SIDEBAR_VALUE_TO_PATH[value],
    trackEntry: SIDEBAR_VALUE_TO_TRACK_ENTRY[value],
  }));

describe("useSideBarViewModel", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    // The sidebar auto-collapses below HIDE_BAR_THRESHOLD (1250px); jsdom's default
    // innerWidth (1024px) is narrower than that, so force a wide viewport here to
    // keep the default (expanded) sidebar state deterministic across tests.
    window.innerWidth = 1440;
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
  });

  it("should return correct default state", () => {
    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      collapsed: false,
      isAccountsDisabled: false,
      active: "home",
    });
  });

  describe("collapse", () => {
    it("should set collapsed explicitly via handleCollapsedChange", () => {
      const { result } = renderViewModel();

      act(() => result.current.handleCollapsedChange(true));
      expect(result.current.collapsed).toBe(true);
    });
  });

  describe("handleActiveChange", () => {
    it('should navigate to /accounts for value "accounts" when asset section is off', () => {
      const trackSpy = jest.spyOn(analytics, "track");
      const { result } = renderViewModel();

      act(() => result.current.handleActiveChange("accounts"));

      expect(mockNavigate).toHaveBeenCalledWith(SIDEBAR_VALUE_TO_PATH.accounts);
      expect(trackSpy).toHaveBeenCalledWith("menuentry_clicked", {
        entry: "accounts",
        page: "/",
        flagged: false,
      });

      trackSpy.mockRestore();
    });

    it('should navigate to /cryptos for value "accounts" when asset section is on', () => {
      const trackSpy = jest.spyOn(analytics, "track");
      const { result } = renderViewModel(
        withFeatureFlags({
          lwdWallet40: { enabled: true, params: { assetSection: true } },
        }),
      );

      act(() => result.current.handleActiveChange("accounts"));

      expect(mockNavigate).toHaveBeenCalledWith("/cryptos");
      expect(trackSpy).toHaveBeenCalledWith("menuentry_clicked", {
        entry: "accounts",
        page: "/",
        flagged: false,
      });

      trackSpy.mockRestore();
    });

    it.each(ACTIVE_CHANGE_NAV_CASES)(
      'should navigate to $path and track "$trackEntry" for value "$value"',
      ({ value, path, trackEntry }) => {
        const trackSpy = jest.spyOn(analytics, "track");
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

    it("should ignore unknown values", () => {
      const { result } = renderViewModel();

      act(() => result.current.handleActiveChange("unknown-value"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should dispatch SCROLL_TO_TOP_EVENT when clicking Home while already on home and Wallet 4.0 main nav is enabled", () => {
      const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
      const { result } = renderViewModel(
        withFeatureFlags({
          lwdWallet40: { enabled: true },
        }),
      );

      act(() => result.current.handleActiveChange("home"));

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SCROLL_TO_TOP_EVENT,
        }),
      );
      dispatchEventSpy.mockRestore();
    });
  });
});
