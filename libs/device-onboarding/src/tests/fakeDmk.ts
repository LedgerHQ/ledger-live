import type {
  CommandResult,
  DeviceActionIntermediateValue,
  DeviceActionState,
  DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";

export type ScriptedCommand<Data, ErrorCodes = void> =
  | CommandResult<Data, ErrorCodes>
  | { throws: unknown };

export type FakeCommandDmk = {
  dmk: DeviceManagementKit;
  sendCommand: jest.Mock;
};

/**
 * Serves the scripted results in order, then repeats the last one, so that a script of one entry
 * answers every retry the same way.
 */
export function createFakeCommandDmk<Data, ErrorCodes = void>(
  script: ScriptedCommand<Data, ErrorCodes>[],
): FakeCommandDmk {
  const remaining = [...script];

  const sendCommand = jest.fn(async () => {
    const next = remaining.length > 1 ? remaining.shift() : remaining[0];

    if (next === undefined) {
      throw new Error("the command script is empty");
    }

    if ("throws" in next) {
      throw next.throws;
    }

    return next;
  });

  return { dmk: { sendCommand } as unknown as DeviceManagementKit, sendCommand };
}

export type FakeDeviceActionExecution<
  Output,
  Error,
  IntermediateValue extends DeviceActionIntermediateValue,
> = {
  states: Subject<DeviceActionState<Output, Error, IntermediateValue>>;
  cancel: jest.Mock;
};

export type FakeDeviceActionDmk<
  Output,
  Error,
  IntermediateValue extends DeviceActionIntermediateValue,
> = {
  dmk: DeviceManagementKit;
  executeDeviceAction: jest.Mock;
  executions: FakeDeviceActionExecution<Output, Error, IntermediateValue>[];
  lastExecution(): FakeDeviceActionExecution<Output, Error, IntermediateValue>;
};

/** Hands one subject per execution, so that a retry is observable as a second execution. */
export function createFakeDeviceActionDmk<
  Output,
  Error,
  IntermediateValue extends DeviceActionIntermediateValue,
>(): FakeDeviceActionDmk<Output, Error, IntermediateValue> {
  const executions: FakeDeviceActionExecution<Output, Error, IntermediateValue>[] = [];

  const executeDeviceAction = jest.fn(() => {
    const states = new Subject<DeviceActionState<Output, Error, IntermediateValue>>();
    const cancel = jest.fn();

    executions.push({ states, cancel });

    return { observable: states.asObservable(), cancel };
  });

  return {
    dmk: { executeDeviceAction } as unknown as DeviceManagementKit,
    executeDeviceAction,
    executions,
    lastExecution: () => {
      const execution = executions.at(-1);

      if (execution === undefined) {
        throw new Error("no device action was executed");
      }

      return execution;
    },
  };
}
