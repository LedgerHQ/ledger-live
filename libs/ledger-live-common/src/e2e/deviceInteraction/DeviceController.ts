import { getEnv } from "@ledgerhq/live-env";
import { getSpeculosAddress } from "../speculos";
import {
  deviceControllerClientFactory,
  type DeviceControllerClient,
  type ButtonKey,
} from "@ledgerhq/speculos-device-controller";

// temp type until DeviceControllerClient exposes buttonFactory type
type ButtonsController = {
  left(): Promise<void>;
  right(): Promise<void>;
  both(): Promise<void>;
  pressSequence(keys: ButtonKey[], delayMs?: number): Promise<void>;
};

type DeviceControllerContext = {
  getDeviceController: () => DeviceControllerClient;
  getButtonsController: () => ButtonsController;
};

const endpointKey = () => `${getSpeculosAddress()}:${getEnv("SPECULOS_API_PORT")}`;

export const getDeviceControllerWithMemo = (() => {
  let cache: { key: string; client: DeviceControllerClient } | null = null;
  return () => {
    const key = endpointKey();
    if (!cache || cache.key !== key) {
      cache = {
        key,
        client: deviceControllerClientFactory(key, {
          timeoutMs: 10000,
        }),
      };
    }
    return cache.client;
  };
})();

export const getButtonsWithMemo = (getController: () => DeviceControllerClient) => {
  let cache: { ctrl: DeviceControllerClient; buttons: ButtonsController } | null = null;
  return () => {
    const ctrl = getController();
    if (!cache || cache.ctrl !== ctrl) {
      cache = { ctrl, buttons: ctrl.buttonFactory() };
    }
    return cache.buttons;
  };
};

/**
 * Wraps a function with access to speculos-device-controller via a tiny DI context.
 *
 * @description
 * Pass a factory that receives a context exposing `getDeviceController()` and `getButtonsController()`.
 * The factory returns the actual implementation. The returned wrapper preserves the implementation’s
 * parameter and return types.
 *
 * Both accessors are lazy, they get or refresh the underlying controller only when called.
 *
 * @param factory - Function invoked immediately with the device context, must return the implementation.
 * @returns A function with the same parameters and return type as the implementation returned by `factory`.
 *
 * @example
 * ```ts
 * const accept = withDeviceController(({ getButtonsController }) => async (timeoutMS: number) => {
 *   const buttons = getButtonsController();
 *   await waitFor(timeoutMS);
 *   await buttons.both();
 * });
 *
 * await accept(1000);
 * ```
 *
 */
export function withDeviceController<A extends unknown[], R>(
  factory: (ctx: DeviceControllerContext) => (...args: A) => R | Promise<R>,
): (...args: A) => R | Promise<R> {
  const ctx: DeviceControllerContext = {
    getDeviceController: getDeviceControllerWithMemo,
    getButtonsController: getButtonsWithMemo(getDeviceControllerWithMemo),
  };
  const implementation = factory(ctx);
  return (...args: A) => implementation(...args);
}
