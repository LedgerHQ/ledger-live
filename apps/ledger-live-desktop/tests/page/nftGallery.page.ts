import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import invariant from "invariant";

export class NftGallery extends AppPage {
  private locateNftInGalleryByName = (nftName: string) => this.page.locator(`text=${nftName}`);
  private nftListGallery = (nftContract: string) =>
    this.page.getByTestId(`nft-row-gallery-${nftContract}`);

  @step("Select NFT $0")
  async selectNFT(nftName: string) {
    await this.locateNftInGalleryByName(nftName).click();
  }

  @step("Expect NFT list to be visible in gallery")
  async verifyNftPresenceInGallery(account: Account) {
    invariant(account.nft && account.nft.length > 0, "No NFT found in account");

    for (const nft of account.nft) {
      const nftLocator = this.nftListGallery(nft.nftContract);
      await expect(nftLocator).toBeVisible();
    }
  }
}
