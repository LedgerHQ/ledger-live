import { currencyParam, openDeeplink } from "../../helpers";

const hostname = "account";

export default class accountPage {
  async openViaDeeplink(currencyName?: string) {
    const link = currencyName ? hostname + currencyParam + currencyName : hostname;
    await openDeeplink(link);
  }
}
