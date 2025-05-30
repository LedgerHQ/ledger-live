import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { expect } from "@playwright/test";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import axios from "axios";
import { getEnv } from "@ledgerhq/live-env";
import invariant from "invariant";

export class NFTDrawer extends Drawer {
  private nftName = this.page.getByTestId("nft-name-sendDrawer");
  private sendButton = this.page.getByTestId("nft-send-button-sendDrawer");
  private nftFloorPrice = this.page.getByTestId("nft-floorPrice");
  private nftOptionsButton = this.page.getByTestId("external-viewer-button");

  @step("Verify nft name is visible")
  async expectNftNameIsVisible(nft: string) {
    await expect(this.nftName).toHaveText(nft);
  }

  @step("click on send button")
  async clickSend() {
    await this.sendButton.click();
  }

  @step("Verify nft floor price is visible")
  async expectNftFloorPriceIsVisible() {
    await expect(this.nftFloorPrice).toBeVisible();
  }

  @step("Retrieve NFT floor price value")
  async getFloorPriceDisplayed() {
    const floorPrice = await this.nftFloorPrice.textContent();
    return floorPrice ? floorPrice?.split(" ")[0] : "";
  }

  @step("Expect nft floor price to be positive")
  async expectNftFloorPricePositive() {
    const floorPrice = await this.getFloorPriceDisplayed();
    expect(parseFloat(floorPrice)).toBeGreaterThan(0);
  }

  @step("Click on nft options")
  async clickNftOptions() {
    await this.nftOptionsButton.click();
  }

  @step("Check Floor price value to be $1")
  async verifyFloorPriceValue(account: Account, floorPrice: string) {
    invariant(account.nft, "No valid NFTs found for this account");
    const { data } = await axios({
      method: "GET",
      url: `${getEnv("NFT_METADATA_SERVICE")}/v2/marketdata/${account.currency.id}/1/contract/${account.nft[0].nftContract}/floor-price`,
    });

    expect(data.value).toEqual(parseFloat(floorPrice));
  }
}
