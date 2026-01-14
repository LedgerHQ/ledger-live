export enum IsDeviceLockedResultType {
  /**
   * The locked state of the device has not been determined yet.
   */
  undetermined = "undetermined",
  /**
   * The device returned an error.
   */
  error = "error",
  /**
   * The device is locked.
   */
  locked = "locked",
  /**
   * The device is unlocked.
   */
  unlocked = "unlocked",
  /**
   * The locked state of the device cannot be determined because the firmware does not support GetAppAndVersion.
   */
  lockedStateCannotBeDetermined = "lockedStateCannotBeDetermined",
}

export type IsDeviceLockedResult =
  | { type: IsDeviceLockedResultType.undetermined }
  | { type: IsDeviceLockedResultType.error; error: Error }
  | { type: IsDeviceLockedResultType.locked }
  | { type: IsDeviceLockedResultType.unlocked }
  | { type: IsDeviceLockedResultType.lockedStateCannotBeDetermined };
