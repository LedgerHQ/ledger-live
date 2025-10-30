import { getEnv } from "@ledgerhq/live-env";
import { getSpeculosAddress } from "../speculos";
import {
  deviceControllerClientFactory,
  type DeviceControllerClient,
} from "@ledgerhq/speculos-device-controller";

export const getDeviceController = (): DeviceControllerClient =>
  deviceControllerClientFactory(`${getSpeculosAddress()}:${getEnv("SPECULOS_API_PORT")}`);

type DeviceCtx = { getDevice: () => DeviceControllerClient };

/**
 * Wraps a function with access to speculos device controller via a tiny DI context.
 *
 * @description
 * Provide a factory that receives a context exposing `getDevice()`. The factory returns the actual
 * implementation, and the returned wrapper preserves the implementation's call signature. The wrapper
 * can be synchronous or asynchronous.
 *
 * `getDevice()` is lazy: call it inside your implementation when you actually need a {@link DeviceControllerClient}.
 *
 * @param factory - Factory receiving the device context and returning the implementation.
 * @returns A function with the same parameters and return type as the implementation returned by `factory`.
 *
 * @example
 * ```ts
 * const accept = withDeviceController(({ getDevice }) => async (timeoutMS: number) => {
 *   const buttons = getDevice().buttonFactory();
 *   await waitFor(timeoutMS);
 *   await buttons.both();
 * });
 *
 * await accept(1000);
 * ```
 *
 */
export function withDeviceController<A extends unknown[], R>(
  factory: (ctx: DeviceCtx) => (...args: A) => R | Promise<R>,
): (...args: A) => R | Promise<R> {
  const ctx: DeviceCtx = { getDevice: getDeviceController };
  const implementation = factory(ctx);
  return (...args: A) => implementation(...args);
}
