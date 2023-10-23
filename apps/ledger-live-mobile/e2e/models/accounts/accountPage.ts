import { currencyParam, openDeeplink } from "../../helpers";

const hostname = "account";

export default class accountPage {
  async openViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? hostname + currencyParam + currencyLong : hostname;
    await openDeeplink(link);
  }
}
