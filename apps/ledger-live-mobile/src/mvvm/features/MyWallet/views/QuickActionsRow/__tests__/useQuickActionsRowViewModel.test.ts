import { Linking } from "react-native";
import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ShieldCheck, ShieldCheckNotification } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { State } from "~/reducers/types";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import { useQuickActionsRowViewModel } from "../useQuickActionsRowViewModel";

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

describe("useQuickActionsRowViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return three actions", () => {
    const { result } = renderHook(() => useQuickActionsRowViewModel());
    expect(result.current.actions).toHaveLength(3);
    expect(result.current.actions.map(a => a.id)).toEqual(["recover", "help", "referral"]);
  });

  describe("help action", () => {
    it("should navigate to MyWalletHelp screen and track event on press", () => {
      const { result } = renderHook(() => useQuickActionsRowViewModel());
      const helpAction = result.current.actions.find(a => a.id === "help")!;

      act(() => helpAction.onPress());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.MyWallet, {
        screen: ScreenName.MyWalletHelp,
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Help",
        page: ScreenName.MyWallet,
      });
    });
  });

  describe("referral action", () => {
    it("should open the referral URL and track event on press", () => {
      const { result } = renderHook(() => useQuickActionsRowViewModel());
      const referralAction = result.current.actions.find(a => a.id === "referral")!;

      act(() => referralAction.onPress());

      expect(Linking.openURL).toHaveBeenCalledWith(urls.referralProgram);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Referral",
        page: ScreenName.MyWallet,
      });
    });
  });

  describe("recover action", () => {
    it("should navigate to Recover screen and track event on press", () => {
      const { result } = renderHook(() => useQuickActionsRowViewModel());
      const recoverAction = result.current.actions.find(a => a.id === "recover")!;

      act(() => recoverAction.onPress());

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.Recover, {
        platform: "protect-simu",
        device: undefined,
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Recover",
        page: ScreenName.MyWallet,
      });
    });

    it('should display "Backup" label when no device is connected', () => {
      const { result } = renderHook(() => useQuickActionsRowViewModel());
      const recoverAction = result.current.actions.find(a => a.id === "recover")!;

      expect(recoverAction.label).toBe("Backup");
    });

    it('should display "[L] Recover" label when a device is connected', () => {
      const { result } = renderHook(() => useQuickActionsRowViewModel(), {
        overrideInitialState: withDevice,
      });
      const recoverAction = result.current.actions.find(a => a.id === "recover")!;

      expect(recoverAction.label).toBe("[L] Recover");
    });

    it("should show notification icon when recover has not been clicked yet", () => {
      const { result } = renderHook(() => useQuickActionsRowViewModel());
      const recoverAction = result.current.actions.find(a => a.id === "recover")!;

      expect(recoverAction.icon).toBe(ShieldCheckNotification);
    });

    it("should show plain icon when recover has already been clicked", () => {
      const { result } = renderHook(() => useQuickActionsRowViewModel(), {
        overrideInitialState: withHasClickedRecover,
      });
      const recoverAction = result.current.actions.find(a => a.id === "recover")!;

      expect(recoverAction.icon).toBe(ShieldCheck);
    });

    it("should persist hasClickedRecover in the store after the first press", () => {
      const { result, store } = renderHook(() => useQuickActionsRowViewModel());

      expect(store.getState().settings.hasClickedRecover).toBe(false);

      act(() => {
        const recoverAction = result.current.actions.find(a => a.id === "recover")!;
        recoverAction.onPress();
      });

      expect(store.getState().settings.hasClickedRecover).toBe(true);
    });

    it("should not dispatch again when recover has already been clicked", () => {
      const { result, store } = renderHook(() => useQuickActionsRowViewModel(), {
        overrideInitialState: withHasClickedRecover,
      });

      const dispatchSpy = jest.spyOn(store, "dispatch");

      act(() => {
        const recoverAction = result.current.actions.find(a => a.id === "recover")!;
        recoverAction.onPress();
      });

      const hasClickedRecoverDispatches = dispatchSpy.mock.calls.filter(
        ([action]) => action.type === "SET_HAS_CLICKED_RECOVER",
      );
      expect(hasClickedRecoverDispatches).toHaveLength(0);
    });
  });
});
