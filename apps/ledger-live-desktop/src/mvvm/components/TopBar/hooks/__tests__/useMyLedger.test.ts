import { LedgerDevices, Nano, Stax } from "@ledgerhq/lumen-ui-react/symbols";
import { DeviceModelId } from "@ledgerhq/devices";
import { renderHook } from "tests/testSetup";
import { useMyLedger } from "../useMyLedger";
import { MANAGER_PATH } from "../../utils/constants";

const mockOpenBuyDeviceModal = jest.fn();
const mockNavigate = jest.fn();

jest.mock("LLD/features/BuyDevice/hooks/useBuyDeviceDialog", () => ({
  __esModule: true,
  default: () => ({ handleOpen: mockOpenBuyDeviceModal }),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const defaultSettings = {
  discreetMode: false,
  vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
  devicesModelList: [],
  anonymousUserNotifications: {},
};

describe("useMyLedger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns icon from lastSeenDevice modelId", () => {
    const { result: resultDefault } = renderHook(() => useMyLedger(), {
      initialState: { settings: { ...defaultSettings, lastSeenDevice: null } },
    });
    expect(resultDefault.current.icon).toBe(LedgerDevices);

    const { result: resultStax } = renderHook(() => useMyLedger(), {
      initialState: {
        settings: { ...defaultSettings, lastSeenDevice: { modelId: DeviceModelId.stax } },
      },
    });
    expect(resultStax.current.icon).toBe(Stax);

    const { result: resultNano } = renderHook(() => useMyLedger(), {
      initialState: {
        settings: { ...defaultSettings, lastSeenDevice: { modelId: DeviceModelId.nanoX } },
      },
    });
    expect(resultNano.current.icon).toBe(Nano);
  });

  describe("handleMyLedger", () => {
    it("opens buy device modal and does not navigate when user has no onboarded device", () => {
      const { result } = renderHook(() => useMyLedger(), {
        initialState: {
          settings: {
            ...defaultSettings,
            lastOnboardedDevice: null,
            lastSeenDevice: null,
          },
        },
      });

      result.current.handleMyLedger();

      expect(mockOpenBuyDeviceModal).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates to manager when user has onboarded device and is not on manager", () => {
      const { result } = renderHook(() => useMyLedger(), {
        initialState: {
          settings: {
            ...defaultSettings,
            lastOnboardedDevice: {
              deviceId: "test-device",
              modelId: DeviceModelId.nanoX,
              wired: false,
            },
            lastSeenDevice: { modelId: DeviceModelId.nanoX },
          },
        },
      });

      result.current.handleMyLedger();

      expect(mockNavigate).toHaveBeenCalledWith(MANAGER_PATH);
      expect(mockOpenBuyDeviceModal).not.toHaveBeenCalled();
    });
  });
});
