import { getElementById, openDeeplink } from "../../helpers";

const baseLink = "myledger";

export default class ManagerPage {
  managerTitle = () => getElementById("manager-title");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }
}
