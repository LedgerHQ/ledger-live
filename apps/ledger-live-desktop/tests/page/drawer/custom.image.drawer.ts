import { waitFor } from "../../utils/waitFor";
import { Component } from "tests/page/abstractClasses";

export class CustomImageDrawer extends Component {
  private importImageInputSelector = "data-testid=custom-image-import-image-input";
  readonly container = this.page.getByTestId("custom-image-container");
  readonly importImageInput = this.page.locator(this.importImageInputSelector);
  private importNftButton = this.page.getByTestId("custom-image-import-nft-button");
  readonly importNftPreviousButton = this.page.getByTestId("custom-image-nft-previous-button");
  private nftCard = (index: number) => this.page.getByTestId(`custom-image-nft-card-${index}`);
  readonly nftCardMedia = (index: number) =>
    this.page.getByTestId(`custom-image-nft-card-media-${index}`);
  readonly nftCardName = (index: number) =>
    this.page.getByTestId(`custom-image-nft-card-name-${index}`);
  readonly nftCardId = (index: number) =>
    this.page.getByTestId(`custom-image-nft-card-id-${index}`);
  private cropView = this.page.getByTestId("custom-image-crop-view");
  private cropRotateButton = this.page.getByTestId("custom-image-crop-rotate-button");
  private cropContinueButton = this.page.getByTestId("custom-image-crop-continue-button");

  private contrastOptionButton = (index: number) =>
    this.page.getByTestId(`custom-image-contrast-option-${index}-button`);
  private contrastPreviousButton = this.page.getByTestId("custom-image-contrast-previous-button");
  readonly contrastContinueButton = this.page.getByTestId("custom-image-contrast-continue-button");
  readonly finishButton = this.page.getByTestId("custom-image-finish-button");
  readonly deviceActionImageLoadRequested = this.page.getByTestId(
    "device-action-image-load-requested",
  );
  readonly deviceActionImageLoading = (progress: number) =>
    this.page.getByTestId(`device-action-image-loading-${progress}`);
  readonly deviceActionImageCommitRequested = this.page.getByTestId(
    "device-action-image-commit-requested",
  );

  async importImage(filePath: string) {
    await this.importImageInput.waitFor({ state: "attached" });
    await this.page.setInputFiles(this.importImageInputSelector, filePath);
  }

  async openNftGallery() {
    await this.importNftButton.waitFor({ state: "attached" });
    await this.importNftButton.click();
  }

  async selectNft(index: number) {
    await this.nftCard(index).waitFor({ state: "attached" });
    await this.nftCard(index).click();
  }

  async waitForCropConfirmable(): Promise<boolean> {
    return waitFor(() => this.cropContinueButton.isEnabled());
  }

  async rotate() {
    await this.waitForCropConfirmable();
    await this.cropRotateButton.click();
    await this.waitForCropConfirmable();
  }

  async wheelCropView(deltaY: number) {
    await this.cropView.waitFor({ state: "attached" });
    await this.waitForCropConfirmable();
    const { x = 0, y = 0, width = 0, height = 0 } = (await this.cropView.boundingBox()) || {};
    await this.page.mouse.move(x + width / 2, y + height / 2);
    await this.page.mouse.wheel(0, deltaY);
    await this.waitForCropConfirmable();
  }

  async cropZoomInMax() {
    await this.wheelCropView(-100000);
  }

  async cropZoomInABit() {
    await this.wheelCropView(-100);
  }

  async cropZoomOutABit() {
    await this.wheelCropView(300);
  }

  async cropZoomOutMax() {
    await this.wheelCropView(100000);
  }

  async confirmCrop() {
    await this.waitForCropConfirmable();
    await this.cropContinueButton.click();
  }

  async chooseContrast(contrastIndex: number) {
    await this.contrastOptionButton(contrastIndex).waitFor({ state: "attached" });
    await this.contrastOptionButton(contrastIndex).click();
    await this.page.waitForTimeout(150);
  }

  async contrastPrevious() {
    await this.contrastPreviousButton.waitFor({ state: "attached" });
    await this.contrastPreviousButton.click();
  }

  async confirmContrast() {
    await this.contrastContinueButton.waitFor({ state: "attached" });
    await this.contrastContinueButton.click();
  }

  async clickFinish() {
    await this.finishButton.waitFor({ state: "attached" });
    await this.finishButton.click();
  }
}
