import { Observable } from "rxjs";
import { scan, map, tap } from "rxjs/operators";
import { useEffect, useMemo, useCallback, useState } from "react";
import { log } from "@ledgerhq/logs";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { UserRefusedDeviceNameChange } from "@ledgerhq/errors";
import { useReplaySubject } from "../../observable";
import type { Action, Device } from "./types";
import {
  RenameDeviceEvent,
  RenameDeviceRequest,
  Input as RenameDeviceInput,
} from "../renameDevice";
import { currentMode } from "./app";
import { getDeviceModel } from "@ledgerhq/devices";
import { getImplementation } from "./implementations";

type RenameDeviceState = {
  isLoading: boolean;
  allowRenamingRequested: boolean;
  unresponsive: boolean;
  device: Device | null | undefined;
  deviceInfo: DeviceInfo | null | undefined;
  error: Error | null | undefined;
  completed?: boolean;
  name: string;
  onRetry?: () => void;
};

type RenameDeviceAction = Action<RenameDeviceRequest, RenameDeviceState, string>;

type Event =
  | RenameDeviceEvent
  | {
      type: "error";
      error: Error;
    }
  | {
      type: "deviceChange";
      device: Device | null | undefined;
    };

const mapResult = (status: RenameDeviceState) => status.name;

const getInitialState = (device?: Device | null | undefined): RenameDeviceState => ({
  isLoading: !!device,
  allowRenamingRequested: false,
  unresponsive: false,
  name: "",
  device,
  deviceInfo: null,
  error: null,
  completed: false,
});

const reducer = (state: RenameDeviceState, e: Event): RenameDeviceState => {
  switch (e.type) {
    case "unresponsiveDevice":
      return { ...state, unresponsive: true, isLoading: false };

    case "deviceChange":
      return getInitialState(e.device);

    case "error":
      return {
        ...getInitialState(state.device),
        error: e.error,
        isLoading: false,
      };
    case "permission-requested":
      return {
        ...state,
        allowRenamingRequested: true,
        unresponsive: false,
        isLoading: false,
      };
    case "device-renamed":
      return {
        ...getInitialState(state.device),
        name: e.name,
        completed: true,
        isLoading: false,
      };
  }
  return state;
};

export const createAction = (
  task: (arg0: RenameDeviceInput) => Observable<RenameDeviceEvent>,
): RenameDeviceAction => {
  const useHook = (
    device: Device | null | undefined,
    request: RenameDeviceRequest,
  ): RenameDeviceState => {
    const [state, setState] = useState(() => getInitialState(device));
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);

    // Changing the nonce causing a refresh of the useEffect
    const onRetry = useCallback(() => {
      setResetIndex(i => i + 1);
      setState(getInitialState(device));
    }, [device]);

    const productName = useMemo(
      () => (device ? getDeviceModel(device.modelId).productName : ""),
      [device],
    );

    useEffect(() => {
      if (state.completed) return;

      const impl = getImplementation(currentMode)<RenameDeviceEvent, RenameDeviceRequest>({
        deviceSubject,
        task,
        request,
      });

      const sub = impl
        .pipe(
          tap((e: any) => log("actions-rename-device-event", e.type, e)),
          map((e: Event) => {
            if (
              productName &&
              e.type === "error" &&
              e.error instanceof UserRefusedDeviceNameChange
            ) {
              e.error = new UserRefusedDeviceNameChange(undefined, {
                productName,
              });
            }
            return e;
          }),
          scan(reducer, getInitialState()),
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [deviceSubject, state.completed, resetIndex, productName, request]);

    return {
      ...state,
      onRetry,
    };
  };

  return {
    useHook,
    mapResult,
  };
};
