import { renderHook } from "tests/testSetup";
import { useBuyDeviceIntercept } from "./useBuyDeviceIntercept";
import { AFTER_ONBOARDING_STATE, INITIAL_STATE } from "~/renderer/reducers/settings";
import * as originFlow from "~/renderer/analytics/originFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

const mockOpenBuyDeviceModal = jest.fn();
const mockSetOriginFlow = jest.mocked(originFlow.setOriginFlow);

let mockPathname = "/manager";
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: () => ({ pathname: mockPathname }),
}));

jest.mock("LLD/features/BuyDevice/hooks/useBuyDeviceDialog", () => ({
  __esModule: true,
  default: () => ({ handleOpen: mockOpenBuyDeviceModal }),
}));

describe("useBuyDeviceIntercept", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/manager";
  });

  it("returns true when hasOnboardedDeviceSelector is true (e.g. lastSeenDevice in settings)", () => {
    const { result } = renderHook(() => useBuyDeviceIntercept(), {
      initialState: { settings: AFTER_ONBOARDING_STATE },
      minimal: false,
    });

    expect(result.current).toBe(true);
    expect(mockOpenBuyDeviceModal).not.toHaveBeenCalled();
  });

  it("returns true when on onboarding or recover route even with no onboarded device in settings", () => {
    mockPathname = "/onboarding/setup-device/connect-device";

    const { result } = renderHook(() => useBuyDeviceIntercept(), {
      initialState: { settings: INITIAL_STATE },
      minimal: false,
    });

    expect(result.current).toBe(true);
    expect(mockOpenBuyDeviceModal).not.toHaveBeenCalled();
  });

  it("returns false and opens Buy Device modal when hasOnboardedDeviceSelector is false and not on device-setup route", () => {
    const { result } = renderHook(() => useBuyDeviceIntercept(), {
      initialState: { settings: INITIAL_STATE },
      minimal: false,
    });

    expect(result.current).toBe(false);
    expect(mockOpenBuyDeviceModal).toHaveBeenCalled();
  });

  it("records the provided location as origin flow when opening the Buy Device modal", () => {
    renderHook(() => useBuyDeviceIntercept(HOOKS_TRACKING_LOCATIONS.addAccountModal), {
      initialState: { settings: INITIAL_STATE },
      minimal: false,
    });

    expect(mockOpenBuyDeviceModal).toHaveBeenCalled();
    expect(mockSetOriginFlow).toHaveBeenCalledWith(HOOKS_TRACKING_LOCATIONS.addAccountModal);
  });

  it("does not record an origin flow when no location is provided", () => {
    renderHook(() => useBuyDeviceIntercept(), {
      initialState: { settings: INITIAL_STATE },
      minimal: false,
    });

    expect(mockOpenBuyDeviceModal).toHaveBeenCalled();
    expect(mockSetOriginFlow).not.toHaveBeenCalled();
  });
});
