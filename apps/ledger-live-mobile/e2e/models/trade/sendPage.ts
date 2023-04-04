import { currencyParam, getElementById, openDeeplink } from "../../helpers";

let baseLink: string = "send";

export default class SendPage {
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");
  getSearchField = () => getElementById("common-search-field");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async sendViaDeeplink(currencyLong?: string) {
    let link = currencyLong
      ? baseLink + currencyParam + currencyLong
      : baseLink;

    await openDeeplink(link);
  }
}
