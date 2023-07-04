import { currencyParam, getElementById, openDeeplink } from "../../helpers";

const baseLink = "receive";

export default class ReceivePage {
  getStep1HeaderTitle = () => getElementById("receive-header-step1-title");
  getStep2HeaderTitle = () => getElementById("receive-header-step2-title");
  getStep3HeaderTitle = () => getElementById("receive-header-step3-title");
  getStep2Accounts = () => getElementById("receive-header-step2-accounts");

  openViaDeeplink() {
    return openDeeplink(baseLink);
  }

  receiveViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    return openDeeplink(link);
  }
}
