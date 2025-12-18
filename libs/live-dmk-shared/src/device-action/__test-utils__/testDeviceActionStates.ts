import {
  type DeviceAction,
  type DeviceActionIntermediateValue,
  type DeviceActionState,
  type DmkError,
  type InternalApi,
} from "@ledgerhq/device-management-kit";

/**
 * Test that the states emitted by a device action match the expected states.
 * @param deviceAction The device action to test.
 * @param expectedStates The expected states.
 * @param callbacks { onDone, onError } The callbacks to call when the test is done or an error occurs.
 */
export function testDeviceActionStates<
  Output,
  Input,
  Error extends DmkError,
  IntermediateValue extends DeviceActionIntermediateValue,
>(
  deviceAction: DeviceAction<Output, Input, Error, IntermediateValue>,
  expectedStates: Array<DeviceActionState<Output, Error, IntermediateValue>>,
  internalApi: InternalApi,
  {
    onDone,
    onError,
  }: {
    onDone: () => void;
    onError: (error: Error) => void;
  },
) {
  const observedStates: Array<DeviceActionState<Output, Error, IntermediateValue>> = [];

  const { observable, cancel } = deviceAction._execute(internalApi);
  observable.subscribe({
    next: state => {
      observedStates.push(state);
    },
    error: error => {
      onError(error);
    },
    complete: () => {
      try {
        expect(observedStates).toEqual(expectedStates);
        onDone();
      } catch (e) {
        onError(e as Error);
      }
    },
  });
  return { observable, cancel };
}

type Hooks<
  Output,
  Error extends DmkError,
  IntermediateValue extends DeviceActionIntermediateValue,
> = {
  onEach?: (state: DeviceActionState<Output, Error, IntermediateValue>) => void;
  onDone?: () => void;
  onError?: (error: Error | unknown) => void;
};

/**
 * Test that the states emitted by a device action match the expected states.
 * This version includes hooks for each state, completion, and error handling.
 * @param deviceAction The device action to test.
 * @param expectedStates The expected states.
 * @param internalApi The internal API to use for execution.
 * @param hooks Optional hooks for onEach state, onDone, and onError.
 * @returns An object containing the observable and a cancel function.
 */
export function testDeviceActionStatesWithUI<
  Output,
  Input,
  Error extends DmkError,
  IntermediateValue extends DeviceActionIntermediateValue,
>(
  deviceAction: DeviceAction<Output, Input, Error, IntermediateValue>,
  expectedStates: Array<DeviceActionState<Output, Error, IntermediateValue>>,
  internalApi: InternalApi,
  hooks: Hooks<Output, Error, IntermediateValue> = {},
) {
  const observedStates: Array<DeviceActionState<Output, Error, IntermediateValue>> = [];
  const { observable, cancel } = deviceAction._execute(internalApi);

  const sub = observable.subscribe({
    next: state => {
      observedStates.push(state);
      hooks.onEach?.(state);
    },
    error: error => {
      hooks.onError?.(error);
      sub.unsubscribe();
    },
    complete: () => {
      try {
        expect(observedStates).toEqual(expectedStates);
        hooks.onDone?.();
      } catch (e) {
        hooks.onError?.(e);
      } finally {
        sub.unsubscribe();
      }
    },
  });

  return { observable, cancel };
}
