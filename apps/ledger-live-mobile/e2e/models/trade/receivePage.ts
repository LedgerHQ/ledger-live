import { currencyParam, getElementById, openDeeplink } from "../../helpers";

const baseLink = "receive";
let link: string;

export default class ReceivePage {
  getStep1HeaderTitle = () => getElementById("receive-header-step1-title");
  getStep2HeaderTitle = () => getElementById("receive-header-step2-title");
  getStep2Accounts = () => getElementById("receive-header-step2-accounts");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async receiveViaDeeplink(currencyLong?: string) {
    link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;

    await openDeeplink(link);
  }
}
