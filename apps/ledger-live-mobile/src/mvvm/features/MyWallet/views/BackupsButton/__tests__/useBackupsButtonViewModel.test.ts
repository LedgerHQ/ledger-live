import { track } from "@shared/analytics";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ShieldCheck, ShieldCheckNotification } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { State } from "~/reducers/types";
import { NavigatorName, ScreenName } from "~/const";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { PROTECT_ID, withRecoverState } from "LLM/features/Portfolio/utils/recoverTestHelpers";
import { ShieldCheckNotificationIcon } from "LLM/features/BackupHub/components/ShieldCheckNotificationIcon";
import { MY_WALLET_TRACKING_PAGE_NAME } from "../../../constants";
import { useBackupsButtonViewModel } from "../useBackupsButtonViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockDevice: Device = {
  modelId: DeviceModelId.nanoX,
  deviceId: "test-device-id",
  deviceName: "Nano X",
  wired: false,
};

const withDevice = (state: State): State => ({
  ...state,
  settings: { ...state.settings, lastConnectedDevice: mockDevice },
});

const withHasClickedRecover = (state: State): State => ({
  ...state,
  settings: { ...state.settings, hasClickedRecover: true },
});

const withBackupHubOn = (subscriptionState: LedgerRecoverSubscriptionStateEnum) =>
  withFlagOverrides(
    {
      lwmBackupHub: { enabled: true },
      protectServicesMobile: { enabled: true, params: { protectId: PROTECT_ID } },
    },
    withRecoverState(subscriptionState, true),
  );

describe("useBackupsButtonViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should expose the backup description", () => {
    const { result } = renderHook(() => useBackupsButtonViewModel());
    expect(result.current.description).toBe("Don't lose access to your assets.");
  });

  it("should navigate to Recover screen and track event on press", () => {
    const { result } = renderHook(() => useBackupsButtonViewModel());

    act(() => result.current.onPress());

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.Recover, {
      platform: "protect-simu",
      device: undefined,
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Recover",
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
  });

  it('should display "Wallet backups" title when no device is connected', () => {
    const { result } = renderHook(() => useBackupsButtonViewModel());

    expect(result.current.title).toBe("Wallet backups");
  });

  it('should display "[L] Recover" label when a device is connected', () => {
    const { result } = renderHook(() => useBackupsButtonViewModel(), {
      overrideInitialState: withDevice,
    });

    expect(result.current.title).toBe("[L] Recover");
  });

  it("should show notification icon when recover has not been clicked yet", () => {
    const { result } = renderHook(() => useBackupsButtonViewModel());

    expect(result.current.icon).toBe(ShieldCheckNotification);
  });

  it("should show plain icon when recover has already been clicked", () => {
    const { result } = renderHook(() => useBackupsButtonViewModel(), {
      overrideInitialState: withHasClickedRecover,
    });

    expect(result.current.icon).toBe(ShieldCheck);
  });

  it("should persist hasClickedRecover in the store after the first press", () => {
    const { result, store } = renderHook(() => useBackupsButtonViewModel());

    expect(store.getState().settings.hasClickedRecover).toBe(false);

    act(() => {
      result.current.onPress();
    });

    expect(store.getState().settings.hasClickedRecover).toBe(true);
  });

  it("should not dispatch again when recover has already been clicked", () => {
    const { result, store } = renderHook(() => useBackupsButtonViewModel(), {
      overrideInitialState: withHasClickedRecover,
    });

    const dispatchSpy = jest.spyOn(store, "dispatch");

    act(() => {
      result.current.onPress();
    });

    const hasClickedRecoverDispatches = dispatchSpy.mock.calls.filter(
      ([action]) => action.type === "SET_HAS_CLICKED_RECOVER",
    );
    expect(hasClickedRecoverDispatches).toHaveLength(0);
  });

  describe("with lwmBackupHub enabled", () => {
    it('should always display the "Wallet backups" title, even with a device connected', () => {
      const { result } = renderHook(() => useBackupsButtonViewModel(), {
        overrideInitialState: state =>
          withBackupHubOn(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION)(withDevice(state)),
      });

      expect(result.current.title).toBe("Wallet backups");
    });

    it("should show the red-dot notification icon when the backup is not done", () => {
      const { result } = renderHook(() => useBackupsButtonViewModel(), {
        overrideInitialState: withBackupHubOn(
          LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY,
        ),
      });

      expect(result.current.icon).toBe(ShieldCheckNotificationIcon);
    });

    it("should show the plain icon (no red dot) when the backup is done", () => {
      const { result } = renderHook(() => useBackupsButtonViewModel(), {
        overrideInitialState: withBackupHubOn(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE),
      });

      expect(result.current.icon).toBe(ShieldCheck);
    });

    it("should open the Backup Hub navigator and track the event on press", () => {
      const { result } = renderHook(() => useBackupsButtonViewModel(), {
        overrideInitialState: withBackupHubOn(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
      });

      act(() => result.current.onPress());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.BackupHub, {
        screen: ScreenName.BackupHub,
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Backup",
        page: MY_WALLET_TRACKING_PAGE_NAME,
      });
    });
  });
});
