import { config as detoxConfig } from "detox/internals";
// @ts-expect-error detox doesn't provide type declarations for this module
import DetoxEnvironment from "detox/runners/jest/testEnvironment";

import { logMemoryUsage } from "./helpers/commonHelpers";

export default class TestEnvironment extends DetoxEnvironment {
  declare global: typeof globalThis;

  async setup() {
    const workerId = Number(process.env.JEST_WORKER_ID ?? 1);
    if (workerId > 1) await this.setupDeviceForSecondaryWorker(workerId);
    await super.setup();
  }

  private async setupDeviceForSecondaryWorker(workerId: number) {
    const configName = process.env.DETOX_CONFIGURATION;
    if (!configName) throw new Error("Missing DETOX_CONFIGURATION environment variable");

    const detoxConfigModule = await import("../detox.config.js");
    const detoxConfigFile =
      "default" in detoxConfigModule ? detoxConfigModule.default : detoxConfigModule;
    const targetConfig = detoxConfigFile.configurations[configName];
    if (!targetConfig || !targetConfig.device) {
      throw new Error(
        `Detox configuration "${configName}" not found or missing device, check your detox config file`,
      );
    }

    const deviceName = `${targetConfig.device}${workerId}`;
    const targetDevice = detoxConfigFile.devices[deviceName];

    if (!targetDevice) {
      throw new Error(
        `Device configuration not found for ${deviceName}, check your detox config file`,
      );
    }

    Object.assign(detoxConfig, { device: targetDevice });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleTestEvent(event: any, state: any) {
    await super.handleTestEvent(event, state);

    if (["hook_failure", "test_fn_failure"].includes(event.name)) {
      this.global.IS_FAILED = true;
    }
    if (event.name === "run_start") {
      await logMemoryUsage();
    }
  }
}
