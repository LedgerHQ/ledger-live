// Global Bridge Events are those emitted for the scanning and the BLE status checks,
// they are called global because they are not tied to a specific instance of the transport
// but rather to static methods.
export type GlobalBridgeEvent = {
  event: "add" | "replace" | "status";
  type: "PoweredOn" | "PoweredOff" | "new-devices" | "new-device";
  data: any;
};

/**
 * The types here should be imported from the types package once we tackle the migration
 * of apps/types out of live-common. This is a bandaid solution avoiding the problem but
 * it's beyond the scope of the feature to do this migration and doing it partially makes
 * no sense.
 */
export type RunnerEvent = any;
export type RawRunnerEvent = {
  event: "task";
  type: "runComplete" | "runError" | "runProgress";

  data: {
    name: string;
    type: string;
    progress: number;

    message?: string; // Used for error inference.
  };
};
