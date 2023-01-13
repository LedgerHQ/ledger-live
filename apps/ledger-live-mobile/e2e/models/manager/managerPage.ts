import { getElementById, waitForElementByID } from "../../helpers";

let proceedButtonId = "Proceed";

export default class ManagerPage {
  getManagerTitle = () => getElementById("manager-title");
  getPairDeviceButton = () => getElementById("pair-device");
  getProceedButton = () => getElementById(proceedButtonId);
  waitProceedButton = () => waitForElementByID(proceedButtonId);
}
