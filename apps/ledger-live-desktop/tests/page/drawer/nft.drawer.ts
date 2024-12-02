import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { expect } from "@playwright/test";

export class NFTDrawer extends Drawer {
  private nftName = this.page.getByTestId("nft-name-sendDrawer");
  private sendButton = this.page.getByTestId("nft-send-button-sendDrawer");
  private nftFloorPrice = this.page.getByTestId("nft-floor-price");
  private nftOptionsButton = this.page.locator("#accounts-options-button");
  private openInOpenSeaButton = this.page.getByText("Open in Opensea.io");

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
  async getFloorPriceplayed() {
    const floorPrice = await this.nftFloorPrice.textContent();
    return floorPrice ? floorPrice?.split(" ")[0] : "";
  }

  @step("Expect nft floor price to be positive")
  async expectNftFloorPricePositive() {
    const floorPrice = await this.getFloorPriceplayed();
    await expect(parseFloat(floorPrice)).toBeGreaterThan(0);
  }

  @step("Click on nft options")
  async clickNftOptions() {
    await this.nftOptionsButton.click();
  }

  @step("Check OpenSea.io")
  async checkOpenSea() {
    /*
     *
     * Interception not working... todo: fix it
     *
     */

    // console.log("Checking OpenSea.io");

    // await this.page.route("*", async (route, request) => {
    //   console.log("Intercepted request URL:", request.url());

    //   const postData = request.postData();
    //   if (postData) {
    //     const payload = JSON.parse(postData);
    //     console.log("Payload:", JSON.stringify(payload, null, 2));

    //     if (payload.event === "OpenURL") {
    //       console.log("OpenURL event detected!");
    //       expect(payload.url).toContain("opensea.io/assets/ethereum");
    //     } else {
    //       console.log("Non-matching event:", payload.event);
    //     }
    //   }
    //   await route.continue();
    // });

    await this.openInOpenSeaButton.click();
  }
}
