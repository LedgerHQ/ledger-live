export default class MarketPage {
  searchBar = () => getElementById("search-box");
  starButton = () => getElementById("star-asset");
  assetCardBackBtn = () => getElementById("market-back-btn");
  marketRowTitle = (index = 0) => getElementById("market-row-title", index);
  starMarketListButton = () => getElementById("toggle-starred-currencies");

  @Step("Search for asset")
  async searchAsset(asset: string) {
    await typeTextByElement(this.searchBar(), asset);
  }

  @Step("Open asset page")
  async openAssetPage(selectAsset: string) {
    await tapByText(selectAsset);
  }

  @Step("Star favorite coin")
  async starFavoriteCoin() {
    await tapByElement(this.starButton());
  }

  @Step("Back to asset list")
  async backToAssetList() {
    await tapByElement(this.assetCardBackBtn());
  }

  @Step("Filter starred asset")
  async filterStaredAsset() {
    await tapByElement(this.starMarketListButton());
  }

  @Step("Expect market row title")
  async expectMarketRowTitle(title: string) {
    await detoxExpect(this.marketRowTitle()).toHaveText(title);
  }
}
