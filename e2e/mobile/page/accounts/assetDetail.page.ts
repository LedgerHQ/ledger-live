import { Step } from "jest-allure2-reporter/api";

const addressItemNameRegExp = /asset-detail-address-item-name-.*/;

export default class AssetDetailPage {
  addressesHeaderId = "asset-detail-addresses-header";

  @Step("Scroll to addresses section header")
  async scrollToAddressesHeader() {
    await scrollToId(this.addressesHeaderId);
  }

  @Step("Get address item name at index")
  async getAddressItemName(index = 0) {
    return await getTextOfElement(addressItemNameRegExp, index);
  }
}
