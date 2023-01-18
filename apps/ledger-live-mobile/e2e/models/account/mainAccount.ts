import { getElementByText, tapByElement } from "../../helpers";

export default class mainAccount {
  async openCryptoAccount(name: string) {
    await tapByElement(getElementByText(name));
  }
}
