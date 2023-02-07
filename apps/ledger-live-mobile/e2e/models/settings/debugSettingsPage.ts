import {
  getElementById,
  getElementByText,
  tapByElement,
} from "../../helpers";

export default class DebugSettingsPage {
  /** GENERAL SETTINGS */
  getFeaturesDebugFlow = () => getElementByText("Features & flows");
  
  async tapFeaturesDebugFlow() {
    await tapByElement(this.getFeaturesDebugFlow());
  }
 
   /** FIRMWARE UPDATE */
  getDebugFirmwareUpdateFlow = () => getElementByText("Firmware Update");
  getTriggerUpdateButton = () => getElementByText("Trigger Update");
  getUpdateStep = () => getElementById("UpdateStep");
  getUpdateProgress = () => getElementById("UpdateProgress");
  getUpdateLockedDevice = () => getElementById("UpdateLockedDevice");
  getUpdateError = () => getElementById("UpdateError");
 
  async tapFirmwareUpdateFlow() {
    await tapByElement(this.getDebugFirmwareUpdateFlow());
  }

  async tapTriggerUpdate() {
    await tapByElement(this.getTriggerUpdateButton());
  }
}
