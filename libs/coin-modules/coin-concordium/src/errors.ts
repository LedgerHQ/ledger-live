export class LockedDeviceError extends Error {
  override name = "LockedDeviceError";
  statusCode?: number;
  constructor(message?: string) {
    super(message ?? "LockedDeviceError");
  }
}
