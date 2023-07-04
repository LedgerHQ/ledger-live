import { currencyParam, getElementById, openDeeplink } from "../../helpers";

const baseLink = "send";

export default class SendPage {
  getStep1HeaderTitle = () => getElementById("send-header-step1-title");
  getSearchField = () => getElementById("common-search-field");

  openViaDeeplink() {
    return openDeeplink(baseLink);
  }

  sendViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;

    return openDeeplink(link);
  }
}
