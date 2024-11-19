import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";
import { expect } from "@playwright/test";

export class NFTDrawer extends Drawer {
  private nftName = this.page.getByTestId("nft-name-sendDrawer");
  private sendButton = this.page.getByTestId("nft-send-button-sendDrawer");

  @step("Verify nft name is visible")
  async expectNftNameIsVisible(nft: string) {
    await expect(this.nftName).toHaveText(nft);
  }

  @step("click on send button")
  async clickSend() {
    await this.sendButton.click();
  }
}
