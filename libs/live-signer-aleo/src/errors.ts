export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
}

export class LockedDeviceError extends Error {
  override name = "LockedDeviceError";
}
