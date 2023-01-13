import { getElementById, waitForElementByText } from "../../helpers";

export default class DiscoveryPage {
  getDicoveryBanner = () => getElementById("discover-banner");
  waitForSelectCrypto = () => waitForElementByText("Select crypto");
}
