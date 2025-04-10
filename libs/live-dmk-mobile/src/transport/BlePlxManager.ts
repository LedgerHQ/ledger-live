import { BleManager as RNBleManager } from "react-native-ble-plx";

export class BlePlxManager {
  private static _instance: RNBleManager;

  static get instance(): RNBleManager {
    if (!this._instance) {
      this._instance = new RNBleManager();
    }
    return this._instance;
  }

  static onStateChange(listener: (state: string) => void, emitCurrentState?: boolean) {
    return this.instance.onStateChange(listener, emitCurrentState);
  }
}
