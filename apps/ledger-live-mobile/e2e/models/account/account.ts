import {
  getElementByText,
  tapByElement,
  waitForElementByText,
} from "../../helpers";

export default class account {
  openTokenAccount = async (name: string) => {
    await waitForElementByText(name);
    await tapByElement(getElementByText(name));
  };
}
