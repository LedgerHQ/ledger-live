import { currencyParam, getElementById, openDeeplink } from "../../helpers";

const baseLink = "receive";

export default class ReceivePage {
  getStep1HeaderTitle = () => getElementById("receive-header-step1-title");
  getStep2HeaderTitle = () => getElementById("receive-header-step2-title");
  getStep2Accounts = () => getElementById("receive-header-step2-accounts");
  getStep2Networks = () => getElementById("receive-header-step2-networks");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async receiveViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;

    await openDeeplink(link);
  }
}
