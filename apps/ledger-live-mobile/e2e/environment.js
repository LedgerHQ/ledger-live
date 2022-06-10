import {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
} from "detox/runners/jest-circus";

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor({ globalConfig, projectConfig }, context) {
    super({ globalConfig, projectConfig }, context);
    // const config = projectConfig;

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.initTimeout = 300000;

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }
}

export default CustomDetoxEnvironment;
