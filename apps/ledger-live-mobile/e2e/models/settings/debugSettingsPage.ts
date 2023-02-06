import {
  getElementByText,
  tapByElement,
} from "../../helpers";

export default class DebugSettingsPage {
  getFeaturesDebugFlow = () => getElementByText("Features & flows");
  getDebugFirmwareUpdateFlow = () => getElementByText("Firmware Update");
  getTriggerUpdateButton = () => getElementByText("Trigger Update");

  async tapFeaturesDebugFlow() {
    await tapByElement(this.getFeaturesDebugFlow());
  }

  /** FIRMWARE UPDATE */
  async tapFirmwareUpdateFlow() {
    await tapByElement(this.getDebugFirmwareUpdateFlow());
  }

  async tapTriggerUpdate() {
    await tapByElement(this.getTriggerUpdateButton());
  }
}
