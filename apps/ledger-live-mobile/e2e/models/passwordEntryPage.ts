import { getElementById, getElementByText, tapByElement, typeTextByElement } from "../helpers";

export default class PasswordEntryPage {
  getPasswordTextInput = () => getElementById("password-text-input");
  getLogin = () => getElementByText("Log in");

  enterPassword(password: string) {
    return typeTextByElement(this.getPasswordTextInput(), password);
  }

  login() {
    return tapByElement(this.getLogin());
  }
}
