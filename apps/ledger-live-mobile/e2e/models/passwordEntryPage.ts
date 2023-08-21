import { getElementById, getElementByText, tapByElement, typeTextByElement } from "../helpers";

export default class PasswordEntryPage {
  getPasswordTextInput = () => getElementById("password-text-input");
  getLogin = () => getElementByText("Log in");

  async enterPassword(password: string) {
    await typeTextByElement(this.getPasswordTextInput(), password, false);
  }

  async login() {
    await tapByElement(this.getLogin());
  }
}
