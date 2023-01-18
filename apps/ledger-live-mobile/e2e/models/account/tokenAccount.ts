import { getElementByText } from "../../helpers";

export default class mainAccount {
  getTokenTitle = (name: string) => {
    return getElementByText(name);
  };
}
