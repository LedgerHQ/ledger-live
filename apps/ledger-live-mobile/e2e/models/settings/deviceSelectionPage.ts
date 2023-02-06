import {
  getElementByText,
  tapByElement,
} from "../../helpers";

export default class DeviceSelectionPage {
  getAddWithBluetoothButton = () => getElementByText("Add with Bluetooth");
  getConnectAnExistingLedger = () => getElementByText("Connect an existing Ledger");
  getNanoXByName = (name: string) => getElementByText(`Nano X de ${name}`)

  async tapAddWithBluetooth() {
    await tapByElement(this.getAddWithBluetoothButton());
  }

  async tapConnectAnExistingLedger() {
    await tapByElement(this.getConnectAnExistingLedger());
  }

  async tapNanoXByName(name: string) {
    await tapByElement(this.getNanoXByName(name));
  }
}
