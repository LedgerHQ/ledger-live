import {
  CommandResultFactory,
  DeviceActionStatus,
  GenuineCheckDeviceAction,
  UserInteractionRequired,
  type Command,
  type CommandResult,
  type DeviceActionIntermediateValue,
  type DeviceActionState,
  type DeviceManagementKit,
  type GenuineCheckDAOutput,
  type GetDeviceMetadataDAOutput,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import { concat, NEVER, of, Subject } from "rxjs";
import {
  ToggleEarlyCheckCommand,
  type ToggleEarlyCheckErrorCode,
} from "../device/toggleEarlyCheckCommand";
import { createOsVersionResponse } from "./osVersionResponse";

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
  const commands = scriptQueue(script, "command");

  const sendCommand = jest.fn(async () => {
    const next = commands.next();

    if ("throws" in next) {
      throw next.throws;
    }

    return next;
  });

  return { dmk: { sendCommand } as unknown as DeviceManagementKit, sendCommand };
}

function scriptQueue<Entry>(script: Entry[], what: string) {
  const remaining = [...script];

  return {
    next(): Entry {
      const entry = remaining.length > 1 ? remaining.shift() : remaining[0];

      if (entry === undefined) {
        throw new Error(`the ${what} script is empty`);
      }

      return entry;
    },
  };
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

export type ScriptedDeviceAction<Output> =
  | { completes: Output }
  | { fails: unknown }
  | { prompts: UserInteractionRequired };

export type OnboardingDmkScript = {
  osVersion?: ScriptedCommand<GetOsVersionResponse>[];
  earlyCheck?: ScriptedCommand<void, ToggleEarlyCheckErrorCode>[];
  genuineCheck?: ScriptedDeviceAction<GenuineCheckDAOutput>[];
  firmwareCheck?: ScriptedDeviceAction<GetDeviceMetadataDAOutput>[];
};

export type FakeOnboardingDmk = {
  dmk: DeviceManagementKit;
  sendCommand: jest.Mock;
  executeDeviceAction: jest.Mock;
  earlyCheckToggles(): number[];
  genuineCheckRuns(): number;
};

export function createFakeOnboardingDmk(script: OnboardingDmkScript = {}): FakeOnboardingDmk {
  const osVersion = scriptQueue(
    script.osVersion ?? [CommandResultFactory({ data: createOsVersionResponse() })],
    "OS version",
  );
  const acceptedToggle: ScriptedCommand<void, ToggleEarlyCheckErrorCode> = CommandResultFactory({
    data: undefined,
  });
  const earlyCheck = scriptQueue(script.earlyCheck ?? [acceptedToggle], "early check");
  const genuineCheck = scriptQueue(script.genuineCheck ?? [], "genuine check");
  const firmwareCheck = scriptQueue(script.firmwareCheck ?? [], "firmware check");

  const toggles: number[] = [];

  const sendCommand = jest.fn(
    async ({ command }: { command: Command<unknown, unknown, never> }) => {
      if (command instanceof ToggleEarlyCheckCommand) {
        toggles.push(command.getApdu().p2);

        return earlyCheck.next();
      }

      const next = osVersion.next();

      if ("throws" in next) {
        throw next.throws;
      }

      return next;
    },
  );

  const executeDeviceAction = jest.fn(({ deviceAction }: { deviceAction: object }) => {
    const isGenuineCheck = deviceAction instanceof GenuineCheckDeviceAction;
    const next = isGenuineCheck ? genuineCheck.next() : firmwareCheck.next();

    if ("prompts" in next) {
      const pending = {
        status: DeviceActionStatus.Pending,
        intermediateValue: { requiredUserInteraction: next.prompts },
      };

      return { observable: concat(of(pending), NEVER), cancel: jest.fn() };
    }

    const state =
      "fails" in next
        ? { status: DeviceActionStatus.Error, error: next.fails }
        : { status: DeviceActionStatus.Completed, output: next.completes };

    return { observable: of(state), cancel: jest.fn() };
  });

  return {
    dmk: { sendCommand, executeDeviceAction } as unknown as DeviceManagementKit,
    sendCommand,
    executeDeviceAction,
    earlyCheckToggles: () => [...toggles],
    genuineCheckRuns: () =>
      executeDeviceAction.mock.calls.filter(
        ([{ deviceAction }]) => deviceAction instanceof GenuineCheckDeviceAction,
      ).length,
  };
}
