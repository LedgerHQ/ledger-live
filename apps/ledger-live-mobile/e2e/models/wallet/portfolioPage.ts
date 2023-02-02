import { getElementById, getElementByText, tapByElement } from "../../helpers";

export default class PortfolioPage {
  getEmptyPortfolio = () => getElementById("PortfolioEmptyAccount");
  getMainButton = () => getElementById("MainButton")
  getSetupDeviceCta = () => getElementById("SetupDeviceCta")
  getReceiveButton = () => getElementByText("Receive");
  getBitcoinButton = () => getElementByText("Bitcoin");
  getBitcoinAccount = () => getElementByText("Bitcoin 1 (legacy)");
  getVerifyAddressButton = () => getElementByText("Verify my address");
  getSettingsButton = () => {
    // FIXME: weird that we check for settings-icon to be sure we are on portfolio page ?
    return getElementById("settings-icon");
  };

  async navigateToSettings() {
    // FIXME: this is probably better in settings page model ?
    await tapByElement(this.getSettingsButton());
  }

  async tapMainButton() {
    await tapByElement(this.getMainButton());
  }

  async tapReceiveButton() {
    await tapByElement(this.getReceiveButton());
  }

  async tapSetupDeviceCta() {
    await tapByElement(this.getSetupDeviceCta());
  }

  async tapBitcoinOption() {
    await tapByElement(this.getBitcoinButton());
  }

  async tapBitcoinAccount() {
    await tapByElement(this.getBitcoinAccount());
  }

  async tapVerifyAddress() {
    await tapByElement(this.getVerifyAddressButton());
  }
}
