import { Page, Locator } from "@playwright/test";

async function waitFor(
  predicate: () => Promise<boolean>,
  intervalMs = 100,
  timeout = 10000,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const condition = await predicate();
      if (condition) {
        clearTimeout(interval);
        resolve(true);
      }
    }, intervalMs);
    setTimeout(() => {
      clearTimeout(interval);
      reject(new Error("waitFor timeout"));
    }, timeout);
  });
}

export class CustomImageDrawer {
  readonly page: Page;
  // readonly importImageButton: Locator;
  readonly container: Locator;
  readonly importImageInputSelector = "data-test-id=custom-image-import-image-input";
  readonly importImageInput: Locator;
  readonly cropView: Locator;
  readonly cropRotateButton: Locator;
  readonly cropContinueButton: Locator;
  readonly contrastOptionButton: (contrastIndex: number) => Locator;
  readonly contrastPreviousButton: Locator;
  readonly contrastContinueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator("data-test-id=custom-image-container");
    this.importImageInput = page.locator(this.importImageInputSelector);
    this.cropView = page.locator("data-test-id=custom-image-crop-view");
    this.cropRotateButton = page.locator("data-test-id=custom-image-crop-rotate-button");
    this.cropContinueButton = page.locator("data-test-id=custom-image-crop-continue-button");

    this.contrastOptionButton = (index: number) =>
      page.locator(`data-test-id=custom-image-contrast-option-${index}-button`);
    this.contrastPreviousButton = page.locator(
      "data-test-id=custom-image-contrast-previous-button",
    );
    this.contrastContinueButton = page.locator(
      "data-test-id=custom-image-contrast-continue-button",
    );
  }

  async importImage(filePath: string) {
    await this.importImageInput.waitFor({ state: "attached" });
    await this.page.setInputFiles(this.importImageInputSelector, filePath);
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
}
