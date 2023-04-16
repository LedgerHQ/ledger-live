import { currencyParam, getElementById, openDeeplink } from "../../helpers";

const baseLink = "send";
let link: string;

export default class SendPage {
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");
  getSearchField = () => getElementById("common-search-field");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async sendViaDeeplink(currencyLong?: string) {
    link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;

    await openDeeplink(link);
  }
}
