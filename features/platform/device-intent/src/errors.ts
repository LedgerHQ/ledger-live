export class NoAcceptedDeviceModelError extends Error {
  override name = "NoAcceptedDeviceModelError";
  constructor() {
    super("Every device model is excluded, so no device can be selected");
  }
}
