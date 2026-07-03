import { type DeviceControllerClient, type ButtonKey } from "@ledgerhq/speculos-device-controller";
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
export declare const getDeviceControllerWithMemo: () => DeviceControllerClient;
export declare const getButtonsWithMemo: (getController: () => DeviceControllerClient) => () => ButtonsController;
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
export declare function withDeviceController<A extends unknown[], R>(factory: (ctx: DeviceControllerContext) => (...args: A) => R | Promise<R>): (...args: A) => R | Promise<R>;
export {};
//# sourceMappingURL=DeviceController.d.ts.map