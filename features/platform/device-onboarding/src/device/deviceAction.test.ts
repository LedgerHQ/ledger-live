import {
  DeviceActionStatus,
  type DeviceActionIntermediateValue,
  type DeviceActionState,
} from "@ledgerhq/device-management-kit";
import { createDeviceActionRunner, DeviceActionStoppedError } from "./deviceAction";
import { createTestStream } from "../tests/testStream";

type Verdict = { isGenuine: boolean };
type States = DeviceActionState<Verdict, Error, DeviceActionIntermediateValue>;

describe("createDeviceActionRunner", () => {
  it("settles the run in flight when it is stopped", async () => {
    const { runner } = start();
    const run = runner.run();

    runner.stop();

    await expect(run).rejects.toBeInstanceOf(DeviceActionStoppedError);
  });

  it("settles the run when the device action ends without a verdict", async () => {
    const { states, runner } = start();
    const run = runner.run();

    states.end();

    await expect(run).rejects.toBeInstanceOf(DeviceActionStoppedError);
  });
});

function start() {
  const states = createTestStream<States>();

  const runner = createDeviceActionRunner<Verdict, Error, DeviceActionIntermediateValue>(() => ({
    observable: states.events,
    // DMK pushes the stopped state from `cancel` itself, which the shared fake does not reproduce.
    cancel: () => states.push({ status: DeviceActionStatus.Stopped }),
  }));

  return { states, runner };
}
