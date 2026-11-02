import { rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { OsUpdate } from "@ledgerhq/live-dmk-shared";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const";
import { useOsUpdateBannerViewModel } from "./useOsUpdateBannerViewModel";

const mockUseRoute = jest.fn();
const mockUseNavigation = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: (...args: unknown[]) => mockUseRoute(...args),
  useNavigation: (...args: unknown[]) => mockUseNavigation(...args),
  useFocusEffect: (callback: () => void) => callback(),
}));

const lastConnectedDevice = { deviceId: "usb|1", modelId: "stax", wired: true };
const osUpdateDevice = {
  id: "usb|1",
  name: null,
  deviceModelId: "stax",
  transport: rnHidTransportIdentifier,
};
const osUpdate = {
  finalFirmware: { version: "1.8.0" },
  osuFirmware: { notes: "notes" },
} as OsUpdate;

function withOsUpdatesState({
  osUpdates = [osUpdate],
  hasConnectedDevice = true,
  hasCompletedOnboarding = true,
}: {
  osUpdates?: OsUpdate[];
  hasConnectedDevice?: boolean;
  hasCompletedOnboarding?: boolean;
} = {}) {
  return withFlagOverrides({ ldmkOsUpdates: { enabled: true } }, (state: State): State => ({
    ...state,
    osUpdate: { osUpdates, hasBackup: false },
    appstate: { ...state.appstate, hasConnectedDevice },
    settings: {
      ...state.settings,
      hasCompletedOnboarding,
      lastConnectedDevice: lastConnectedDevice as State["settings"]["lastConnectedDevice"],
    },
  }));
}

describe("useOsUpdateBannerViewModel", () => {
  const navigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoute.mockReturnValue({ name: ScreenName.Portfolio });
    mockUseNavigation.mockReturnValue({ navigate });
  });

  it("shows the portfolio banner with the version of the last resolved update", () => {
    const { result } = renderHook(() => useOsUpdateBannerViewModel(), {
      overrideInitialState: withOsUpdatesState({
        osUpdates: [{ finalFirmware: { version: "1.7.0" } } as OsUpdate, osUpdate],
      }),
    });

    expect(result.current.variant).toBe("portfolio");
    expect(result.current.version).toBe("1.8.0");
  });

  it.each([
    ["there is no update", { osUpdates: [] as OsUpdate[] }],
    ["onboarding is not completed", { hasCompletedOnboarding: false }],
    ["no device was connected in this session", { hasConnectedDevice: false }],
  ])("hides the banner when %s", (_label, state) => {
    const { result } = renderHook(() => useOsUpdateBannerViewModel(), {
      overrideInitialState: withOsUpdatesState(state),
    });

    expect(result.current.variant).toBe("hidden");
  });

  it("goes to My Ledger with the last device and asks to open the What's new from the portfolio", () => {
    const { result } = renderHook(() => useOsUpdateBannerViewModel(), {
      overrideInitialState: withOsUpdatesState(),
    });

    result.current.onClickUpdate();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][1]).toMatchObject({
      params: { device: lastConnectedDevice, firmwareUpdate: true },
    });
  });

  it("opens the OS update flow from My Ledger", () => {
    mockUseRoute.mockReturnValue({ name: ScreenName.MyLedgerDevice });
    const { result } = renderHook(() => useOsUpdateBannerViewModel(), {
      overrideInitialState: withOsUpdatesState(),
    });

    result.current.onClickUpdate();

    expect(result.current.variant).toBe("myLedger");
    expect(navigate).toHaveBeenCalledWith(ScreenName.OsUpdate, { device: osUpdateDevice });
  });
});
