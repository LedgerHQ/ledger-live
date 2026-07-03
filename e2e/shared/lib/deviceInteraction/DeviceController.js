"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getButtonsWithMemo = exports.getDeviceControllerWithMemo = void 0;
exports.withDeviceController = withDeviceController;
const live_env_1 = require("@ledgerhq/live-env");
const speculos_1 = require("../speculos");
const speculos_device_controller_1 = require("@ledgerhq/speculos-device-controller");
const retryAxiosRequest_1 = require("./retryAxiosRequest");
const endpointKey = () => `${(0, speculos_1.getSpeculosAddress)()}:${(0, live_env_1.getEnv)("SPECULOS_API_PORT")}`;
exports.getDeviceControllerWithMemo = (() => {
    let cache = null;
    return () => {
        const key = endpointKey();
        if (!cache || cache.key !== key) {
            cache = {
                key,
                client: (0, speculos_device_controller_1.deviceControllerClientFactory)(key, {
                    timeoutMs: 10000,
                }),
            };
        }
        return cache.client;
    };
})();
const getButtonsWithMemo = (getController) => {
    let cache = null;
    return () => {
        const ctrl = getController();
        if (!cache || cache.ctrl !== ctrl) {
            const inner = ctrl.buttonFactory();
            cache = {
                ctrl,
                buttons: {
                    left: () => (0, retryAxiosRequest_1.retryAxiosRequest)(() => inner.left()),
                    right: () => (0, retryAxiosRequest_1.retryAxiosRequest)(() => inner.right()),
                    both: () => (0, retryAxiosRequest_1.retryAxiosRequest)(() => inner.both()),
                    pressSequence: (keys, delayMs) => (0, retryAxiosRequest_1.retryAxiosRequest)(() => inner.pressSequence(keys, delayMs)),
                },
            };
        }
        return cache.buttons;
    };
};
exports.getButtonsWithMemo = getButtonsWithMemo;
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
function withDeviceController(factory) {
    const ctx = {
        getDeviceController: exports.getDeviceControllerWithMemo,
        getButtonsController: (0, exports.getButtonsWithMemo)(exports.getDeviceControllerWithMemo),
    };
    const implementation = factory(ctx);
    return (...args) => implementation(...args);
}
//# sourceMappingURL=DeviceController.js.map