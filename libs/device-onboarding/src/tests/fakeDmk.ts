import {
  CommandResultFactory,
  DeviceActionStatus,
  GenuineCheckDeviceAction,
  UserInteractionRequired,
  type CommandResult,
  type DeviceActionIntermediateValue,
  type DeviceActionState,
  type DeviceManagementKit,
  type GenuineCheckDAOutput,
  type GetDeviceMetadataDAOutput,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import { concat, NEVER, of } from "rxjs";
import {
  ToggleEarlyCheckCommand,
  type ToggleEarlyCheckErrorCode,
} from "../device/toggleEarlyCheckCommand";
import { createDeviceManagementKit } from "./createDeviceManagementKit";
import { createTestStream } from "./testStream";
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

  const sendCommand = jest.fn(async () => played(commands.next()));
  const dmk = createDeviceManagementKit({ sendCommand });

  return { dmk, sendCommand };
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
  complete(output: Output): void;
  fail(error: Error): void;
  pending(intermediateValue: IntermediateValue): void;
  stop(): void;
  readonly watched: boolean;
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
    const { execution, events } = createDeviceActionExecution<Output, Error, IntermediateValue>();
    executions.push(execution);

    return { observable: events, cancel: execution.cancel };
  });
  const dmk = createDeviceManagementKit({ executeDeviceAction });

  return {
    dmk,
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

function createDeviceActionExecution<
  Output,
  Error,
  IntermediateValue extends DeviceActionIntermediateValue,
>() {
  const states = createTestStream<DeviceActionState<Output, Error, IntermediateValue>>();
  const cancel = jest.fn();
  const execution: FakeDeviceActionExecution<Output, Error, IntermediateValue> = {
    complete: output => states.push({ status: DeviceActionStatus.Completed, output }),
    fail: error => states.push({ status: DeviceActionStatus.Error, error }),
    pending: intermediateValue =>
      states.push({ status: DeviceActionStatus.Pending, intermediateValue }),
    stop: () => states.push({ status: DeviceActionStatus.Stopped }),
    get watched() {
      return states.watched;
    },
    cancel,
  };

  return { execution, events: states.events };
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
  firmwareCheckRuns(): number;
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

  const sendCommand = jest.fn(async ({ command }) => {
    if (command instanceof ToggleEarlyCheckCommand) {
      toggles.push(command.getApdu().p2);

      return played(earlyCheck.next());
    }

    return played(osVersion.next());
  });
  const executeDeviceAction = jest.fn(({ deviceAction }) => {
    const isGenuineCheck = deviceAction instanceof GenuineCheckDeviceAction;
    const next = isGenuineCheck ? genuineCheck.next() : firmwareCheck.next();

    return scriptedAction(next);
  });
  const dmk = createDeviceManagementKit({ sendCommand, executeDeviceAction });

  return {
    dmk,
    sendCommand,
    executeDeviceAction,
    earlyCheckToggles: () => [...toggles],
    genuineCheckRuns: () => runsOf(true),
    firmwareCheckRuns: () => runsOf(false),
  };

  function runsOf(genuine: boolean): number {
    return executeDeviceAction.mock.calls.filter(
      ([{ deviceAction }]) => deviceAction instanceof GenuineCheckDeviceAction === genuine,
    ).length;
  }
}

function played<T>(entry: T | { throws: unknown }): T {
  if (typeof entry === "object" && entry !== null && "throws" in entry) {
    throw entry.throws;
  }

  return entry as T;
}

function scriptedAction(next: ScriptedDeviceAction<unknown>) {
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
}
