const DEVICE_ID_SYMBOL = Symbol("deviceId");

export class DeviceId {
  private readonly [DEVICE_ID_SYMBOL]: string;

  static fromString(id: string): DeviceId {
    return new DeviceId(id);
  }

  constructor(id: string) {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("DeviceId must be a non-empty string");
    }
    this[DEVICE_ID_SYMBOL] = id;
  }

  toString(): string {
    return "[DeviceId:REDACTED]";
  }

  toJSON(): string {
    return "[DeviceId:REDACTED]";
  }

  exportDeviceIdForPushDevicesService(): string {
    return this[DEVICE_ID_SYMBOL];
  }

  exportDeviceIdForPersistence(): string {
    return this[DEVICE_ID_SYMBOL];
  }

  equals(other: DeviceId): boolean {
    return this[DEVICE_ID_SYMBOL] === other[DEVICE_ID_SYMBOL];
  }
}
