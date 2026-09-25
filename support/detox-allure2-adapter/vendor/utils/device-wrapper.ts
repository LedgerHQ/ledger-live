export class DeviceWrapper {
  constructor(private readonly device: Detox.Device) {}

  get id() {
    return this.device.id;
  }

  get platform() {
    return this.device.getPlatform();
  }

  get adbPath(): string | undefined {
    return this.#deviceAny.deviceDriver?.adb?.adbBin;
  }

  get #deviceAny(): any {
    return this.device as any;
  }
}
