export class LockedDeviceError extends Error {
  override name = "LockedDeviceError";
  constructor(message?: string) {
    super(message ?? "LockedDeviceError");
  }
}
