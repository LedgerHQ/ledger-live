import { Linking } from "react-native";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useInitializerActions } from "../useInitializerActions";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import type { InitializerDevice } from "../../types";

const mockReset = jest.fn();
const mockGetParent = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    reset: mockReset,
    getParent: mockGetParent,
  }),
}));

const nanoX: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.nanoX,
  name: "Ledger Nano X",
  productName: "Nano X",
  wired: true,
};

const stax: InitializerDevice = {
  id: "device-id-stax",
  modelId: DeviceModelId.stax,
  name: "Ledger Stax",
  productName: "Stax",
  wired: false,
};

const withMyWallet = (state: State): State =>
  withFlagOverrides({
    lwmWallet40: {
      params: { myWallet: true },
    },
  })(state);

describe("useInitializerActions", () => {
  beforeEach(() => {
    mockReset.mockReset();
    mockGetParent.mockReset();
    // Default: useNavigation() is already the root navigator, getParent() returns null
    mockGetParent.mockReturnValue(null);
  });

  describe("openMyLedger", () => {
    it("resets the root navigator to the MyLedger manager when shouldDisplayMyWallet is false (default)", () => {
      const { result } = renderHook(() => useInitializerActions(nanoX));

      act(() => {
        result.current.openMyLedger("ethereum");
      });

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          {
            name: NavigatorName.Base,
            state: {
              index: 1,
              routes: [
                { name: NavigatorName.Main },
                {
                  name: NavigatorName.MyLedger,
                  state: {
                    routes: [
                      {
                        name: ScreenName.MyLedgerChooseDevice,
                        params: { searchQuery: "ethereum" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });

    it("resets the root navigator to the MyWallet manager when shouldDisplayMyWallet is true", () => {
      const { result } = renderHook(() => useInitializerActions(nanoX), {
        overrideInitialState: withMyWallet,
      });

      act(() => {
        result.current.openMyLedger("ethereum");
      });

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          {
            name: NavigatorName.Base,
            state: {
              index: 1,
              routes: [
                { name: NavigatorName.Main },
                {
                  name: NavigatorName.MyWallet,
                  state: {
                    routes: [
                      {
                        name: ScreenName.MyWallet,
                        params: { searchQuery: "ethereum" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe("openMyLedgerFirmwareUpdate", () => {
    it("targets MyLedger for wireless devices when shouldDisplayMyWallet is false (default)", () => {
      const { result } = renderHook(() => useInitializerActions(stax));

      act(() => {
        result.current.openMyLedgerFirmwareUpdate();
      });

      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          {
            name: NavigatorName.Base,
            state: {
              index: 1,
              routes: [
                { name: NavigatorName.Main },
                {
                  name: NavigatorName.MyLedger,
                  state: {
                    routes: [
                      {
                        name: ScreenName.MyLedgerChooseDevice,
                        params: {
                          device: {
                            deviceId: stax.id,
                            deviceName: stax.name,
                            modelId: stax.modelId,
                            wired: stax.wired,
                          },
                          firmwareUpdate: false,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });

    it("targets MyWallet with firmwareUpdate=false for wireless devices when shouldDisplayMyWallet is true", () => {
      const { result } = renderHook(() => useInitializerActions(stax), {
        overrideInitialState: withMyWallet,
      });

      act(() => {
        result.current.openMyLedgerFirmwareUpdate();
      });

      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          {
            name: NavigatorName.Base,
            state: {
              index: 1,
              routes: [
                { name: NavigatorName.Main },
                {
                  name: NavigatorName.MyWallet,
                  state: {
                    routes: [
                      {
                        name: ScreenName.MyWallet,
                        params: {
                          device: {
                            deviceId: stax.id,
                            deviceName: stax.name,
                            modelId: stax.modelId,
                            wired: stax.wired,
                          },
                          firmwareUpdate: false,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe("openOnboarding", () => {
    it("resets to the SyncOnboarding companion when the device supports sync onboarding", () => {
      const { result } = renderHook(() => useInitializerActions(stax));

      act(() => {
        result.current.openOnboarding();
      });

      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          {
            name: NavigatorName.BaseOnboarding,
            state: {
              routes: [
                {
                  name: NavigatorName.SyncOnboarding,
                  state: {
                    routes: [
                      {
                        name: ScreenName.SyncOnboardingCompanion,
                        params: {
                          device: {
                            deviceId: stax.id,
                            deviceName: stax.name,
                            modelId: stax.modelId,
                            wired: stax.wired,
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });

    it("resets to the legacy Onboarding use-case picker when the device does not support sync onboarding", () => {
      const { result } = renderHook(() => useInitializerActions(nanoX));

      act(() => {
        result.current.openOnboarding();
      });

      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          {
            name: NavigatorName.BaseOnboarding,
            state: {
              routes: [
                {
                  name: NavigatorName.Onboarding,
                  state: {
                    routes: [
                      {
                        name: ScreenName.OnboardingUseCase,
                        params: { deviceModelId: nanoX.modelId },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe("openSupport", () => {
    it("opens the localized contact support URL", () => {
      const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

      const { result } = renderHook(() => useInitializerActions(nanoX));

      act(() => {
        result.current.openSupport();
      });

      expect(openURLSpy).toHaveBeenCalledTimes(1);
      expect(openURLSpy.mock.calls[0][0]).toMatch(/^https?:\/\//);
      expect(mockReset).not.toHaveBeenCalled();

      openURLSpy.mockRestore();
    });
  });
});
