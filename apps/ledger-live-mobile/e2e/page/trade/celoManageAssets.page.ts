export default class CeloManageAssetsPage {
  titleId = "live-app-title";
  title = () => getElementById(this.titleId);

  @Step("Wait for CELO manage assets")
  async waitForManageAssets() {
    await waitForElementById(this.titleId);
  }
}
