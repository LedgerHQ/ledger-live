import { BleManager as RNBleManager, LogLevel, Device, BleError } from "react-native-ble-plx";
import { awaitsBleOn } from "./awaitsBleOn";
import { getBluetoothServiceUuids } from "@ledgerhq/devices";

export class BlePlxManager {
  /**
   * Returns the instance of the Bluetooth Low Energy Manager. It initializes it only
   * when it's first needed, preventing the permission prompt happening prematurely.
   * Important: Do NOT access the _bleManager variable directly.
   * Use this function instead.
   * @returns {BleManager} - The instance of the BleManager.
   */
  static _instance: RNBleManager;

  static get instance(): RNBleManager {
    if (!this._instance) {
      this._instance = new RNBleManager();
    }
    return this._instance;
  }

  static waitOn() {
    return awaitsBleOn(BlePlxManager.instance);
  }

  static async getKnownDevice(identifier: string) {
    const devices = await this.instance.devices([identifier]);
    return devices[0];
  }

  static getConnectedDevices() {
    return this.instance.connectedDevices(getBluetoothServiceUuids());
  }

  static connect(identifier: string, options: Record<string, unknown> = {}) {
    return this.instance.connectToDevice(identifier, options);
  }
  /**
   * Exposed method from the ble-plx library
   * Sets new log level for native module's logging mechanism.
   * @param logLevel
   */
  static async setLogLevel(logLevel: string) {
    if (Object.values<string>(LogLevel).includes(logLevel)) {
      await this.instance.setLogLevel(logLevel as LogLevel);
    } else {
      throw new Error(`${logLevel} is not a valid LogLevel`);
    }
  }

  static onStateChange(listener: (state: any) => void, emitCurrentState?: boolean) {
    return this.instance.onStateChange(listener, emitCurrentState);
  }

  static async startScan(callback: (error: BleError | null, device: Device | null) => void) {
    await this.instance.startDeviceScan(getBluetoothServiceUuids(), null, (error, device) => {
      callback(error, device);
    });
  }

  static async stopScan() {
    await this.instance.stopDeviceScan();
  }

  static async disconnectDevice(deviceIdentifier: string) {
    await this.instance.cancelDeviceConnection(deviceIdentifier);
  }

  static async cancelTransaction(transactionId: string) {
    await this.instance.cancelTransaction(transactionId);
  }
}
