import { EMPTY, Observable, interval } from "rxjs";
import { debounce, scan, tap } from "rxjs/operators";
import { useEffect, useCallback, useState } from "react";
import { log } from "@ledgerhq/logs";
import type { DeviceInfo } from "@ledgerhq/types-live";
import type { ListAppsResult } from "../../apps/types";
import { useReplaySubject } from "../../observable";
import manager from "../../manager";
import type {
  Input as ConnectManagerInput,
  ConnectManagerEvent,
} from "../connectManager";
import type { Action, Device } from "./types";
import { currentMode } from "./app";
import { getImplementation } from "./implementations";

type State = {
  isLoading: boolean;
  requestQuitApp: boolean;
  unresponsive: boolean;
  allowManagerRequestedWording: string | null | undefined;
  allowManagerGranted: boolean;
  device: Device | null | undefined;
  deviceInfo: DeviceInfo | null | undefined;
  result: ListAppsResult | null | undefined;
  error: Error | null | undefined;
  isLocked: boolean;
};

type ManagerState = State & {
  repairModalOpened:
    | {
        auto: boolean;
      }
    | null
    | undefined;
  onRetry: () => void;
  onAutoRepair: () => void;
  onRepairModal: (arg0: boolean) => void;
  closeRepairModal: () => void;
};

export type ManagerRequest =
  | {
      autoQuitAppDisabled?: boolean;
    }
  | null
  | undefined;

export type Result = {
  device: Device;
  deviceInfo: DeviceInfo;
  result: ListAppsResult | null | undefined;
};

type ConnectManagerAction = Action<ManagerRequest, ManagerState, Result>;

type Event =
  | ConnectManagerEvent
  | {
      type: "error";
      error: Error;
    }
  | {
      type: "deviceChange";
      device: Device | null | undefined;
    };

const mapResult = ({ deviceInfo, device, result }): Result | null | undefined =>
  deviceInfo && device
    ? {
        device,
        deviceInfo,
        result,
      }
    : null;

const getInitialState = (device?: Device | null | undefined): State => ({
  isLoading: device === undefined || !!device,
  requestQuitApp: false,
  unresponsive: false,
  isLocked: false,
  allowManagerRequestedWording: null,
  allowManagerGranted: false,
  device,
  deviceInfo: null,
  result: null,
  error: null,
});

const reducer = (state: State, e: Event): State => {
  switch (e.type) {
    case "unresponsiveDevice":
      return { ...state, unresponsive: true };

    case "lockedDevice":
      return { ...state, isLocked: true };

    case "deviceChange":
      return getInitialState(e.device);

    case "error":
      return {
        ...getInitialState(state.device),
        error: e.error,
        isLoading: false,
        isLocked: false,
      };

    case "appDetected":
      return {
        ...state,
        unresponsive: false,
        isLocked: false,
        requestQuitApp: true,
      };

    case "osu":
    case "bootloader":
      return {
        ...state,
        isLoading: false,
        unresponsive: false,
        isLocked: false,
        requestQuitApp: false,
        deviceInfo: e.deviceInfo,
      };

    case "listingApps":
      return {
        ...state,
        isLoading: true,
        requestQuitApp: false,
        unresponsive: false,
        isLocked: false,
        deviceInfo: e.deviceInfo,
      };

    case "device-permission-requested":
      return {
        ...state,
        unresponsive: false,
        isLocked: false,
        allowManagerRequestedWording: e.wording,
      };

    case "device-permission-granted":
      return {
        ...state,
        unresponsive: false,
        isLocked: false,
        allowManagerRequestedWording: null,
        allowManagerGranted: true,
      };

    case "result":
      return {
        ...state,
        isLoading: false,
        unresponsive: false,
        isLocked: false,
        result: e.result,
      };
  }

  return state;
};

export const createAction = (
  task: (arg0: ConnectManagerInput) => Observable<ConnectManagerEvent>
): ConnectManagerAction => {
  const useHook = (
    device: Device | null | undefined,
    request: ManagerRequest = {}
  ): ManagerState => {
    const [state, setState] = useState(() => getInitialState());
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);

    // repair modal will interrupt everything and be rendered instead of the background content
    const [repairModalOpened, setRepairModalOpened] = useState<{
      auto: boolean;
    } | null>(null);

    useEffect(() => {
      const impl = getImplementation(currentMode)<
        ConnectManagerEvent,
        ManagerRequest
      >({
        deviceSubject,
        task,
        request,
      });

      if (repairModalOpened) return;
      const sub = impl
        .pipe(
          tap((e: any) => log("actions-manager-event", e.type, e)),
          debounce((e: Event) =>
            "replaceable" in e && e.replaceable ? interval(100) : EMPTY
          ),
          scan(reducer, getInitialState())
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [deviceSubject, resetIndex, repairModalOpened, request]);

    const { deviceInfo } = state;
    useEffect(() => {
      if (!deviceInfo) return;
      // Preload latest firmware in parallel
      manager.getLatestFirmwareForDevice(deviceInfo).catch((e: Error) => {
        log("warn", e.message);
      });
    }, [deviceInfo]);

    const onRepairModal = useCallback((open) => {
      setRepairModalOpened(
        open
          ? {
              auto: false,
            }
          : null
      );
    }, []);

    const closeRepairModal = useCallback(() => {
      // Sets isBootloader to true to avoid having the renderBootloaderStep rendered,
      // on which the user could re-trigger a bootloader repairing scenario that is not needed
      setState((prevState) => {
        return {
          ...prevState,
          deviceInfo: prevState.deviceInfo
            ? { ...prevState.deviceInfo, isBootloader: false }
            : null,
        };
      });
      setRepairModalOpened(null);
    }, []);

    const onRetry = useCallback(() => {
      setResetIndex((currIndex) => currIndex + 1);
      setState((s) => getInitialState(s.device));
    }, []);

    const onAutoRepair = useCallback(() => {
      setRepairModalOpened({
        auto: true,
      });
    }, []);

    return {
      ...state,
      repairModalOpened,
      onRetry,
      onAutoRepair,
      closeRepairModal,
      onRepairModal,
    };
  };

  return {
    useHook,
    mapResult,
  };
};
