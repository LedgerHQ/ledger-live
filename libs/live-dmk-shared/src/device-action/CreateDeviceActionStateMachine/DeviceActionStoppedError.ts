import { type DmkError } from "@ledgerhq/device-management-kit";

export class DeviceActionStoppedError implements DmkError {
  readonly _tag = "DeviceActionStoppedError";
  readonly originalError?: Error;

  constructor(message?: string) {
    this.originalError = new Error(message ?? "Device action was cancelled.");
  }
}
