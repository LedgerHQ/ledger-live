import { renderHook } from "tests/testSetup";
import { useBuyDeviceIntercept } from "./useBuyDeviceIntercept";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

const mockOpenBuyDeviceModal = jest.fn();
const mockDispatch = jest.fn();

let mockPathname = "/manager";
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: () => ({ pathname: mockPathname }),
}));

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => mockDispatch,
}));

jest.mock("LLD/features/BuyDevice/hooks/useBuyDeviceDialog", () => ({
  __esModule: true,
  default: () => ({ handleOpen: mockOpenBuyDeviceModal }),
}));

const stateWithOnboardedDevice = {
  settings: {
    ...INITIAL_STATE,
    lastOnboardedDevice: {
      deviceId: "test-device",
      modelId: DeviceModelId.nanoX,
      wired: false,
    },
  },
  devices: { currentDevice: null, devices: [] },
};

const stateWithConnectedDevice = {
  settings: { ...INITIAL_STATE, lastOnboardedDevice: null, lastSeenDevice: null },
  devices: {
    currentDevice: { deviceId: "device-1", modelId: DeviceModelId.nanoX, wired: false },
    devices: [{ deviceId: "device-1", modelId: DeviceModelId.nanoX, wired: false }],
  },
};

const stateWithoutDevice = {
  settings: { ...INITIAL_STATE, lastOnboardedDevice: null, lastSeenDevice: null },
  devices: { currentDevice: null, devices: [] },
};

describe("useBuyDeviceIntercept", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/manager";
  });

  it("returns true when user has onboarded device", () => {
    const { result } = renderHook(() => useBuyDeviceIntercept(), {
      initialState: stateWithOnboardedDevice,
      minimal: false,
    });

    expect(result.current).toBe(true);
    expect(mockOpenBuyDeviceModal).not.toHaveBeenCalled();
  });

  it("returns true when device is connected", () => {
    const { result } = renderHook(() => useBuyDeviceIntercept(), {
      initialState: stateWithConnectedDevice,
      minimal: false,
    });

    expect(result.current).toBe(true);
    expect(mockOpenBuyDeviceModal).not.toHaveBeenCalled();
  });

  it("returns true when on onboarding route even without device", () => {
    mockPathname = "/onboarding/setup-device/connect-device";

    const { result } = renderHook(() => useBuyDeviceIntercept(), {
      initialState: stateWithoutDevice,
      minimal: false,
    });

    expect(result.current).toBe(true);
    expect(mockOpenBuyDeviceModal).not.toHaveBeenCalled();
  });

  it("returns false and opens Buy Device modal when no device and not on device-setup route", () => {
    const { result } = renderHook(() => useBuyDeviceIntercept(), {
      initialState: stateWithoutDevice,
      minimal: false,
    });

    expect(result.current).toBe(false);
    expect(mockOpenBuyDeviceModal).toHaveBeenCalled();
  });
});
