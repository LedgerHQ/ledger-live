import { getEnv } from "@ledgerhq/live-env";
import { getSpeculosAddress } from "../speculos";
import { deviceControllerClientFactory, } from "@ledgerhq/speculos-device-controller";
import { retryAxiosRequest } from "./retryAxiosRequest";
const endpointKey = () => `${getSpeculosAddress()}:${getEnv("SPECULOS_API_PORT")}`;
export const getDeviceControllerWithMemo = (() => {
    let cache = null;
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
export const getButtonsWithMemo = (getController) => {
    let cache = null;
    return () => {
        const ctrl = getController();
        if (!cache || cache.ctrl !== ctrl) {
            const inner = ctrl.buttonFactory();
            cache = {
                ctrl,
                buttons: {
                    left: () => retryAxiosRequest(() => inner.left()),
                    right: () => retryAxiosRequest(() => inner.right()),
                    both: () => retryAxiosRequest(() => inner.both()),
                    pressSequence: (keys, delayMs) => retryAxiosRequest(() => inner.pressSequence(keys, delayMs)),
                },
            };
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
export function withDeviceController(factory) {
    const ctx = {
        getDeviceController: getDeviceControllerWithMemo,
        getButtonsController: getButtonsWithMemo(getDeviceControllerWithMemo),
    };
    const implementation = factory(ctx);
    return (...args) => implementation(...args);
}
//# sourceMappingURL=DeviceController.js.map