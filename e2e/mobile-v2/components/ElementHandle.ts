import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
import { switchToWebview, Webview } from "./SwitchToWebview";
import { switchToNativeApp } from "@e2e-mobile/utils/DriverUtils";

export type ElementHandleOptions = {
  parent?: ElementHandle;
  webview?: Webview;
};

export type ExpectTextOptions = {
  /** Any run of whitespace, non-breaking spaces included, counts as one space; zero-width spaces and edges are dropped. */
  normaliseWhitespace?: boolean;
  /** The element's text contains `text` instead of being equal to it. */
  containing?: boolean;
  /** Letter case is ignored, e.g. a checksummed EVM address against a lowercase fixture. */
  ignoreCase?: boolean;
};

export type ReplaceTextOptions = {
  incremental?: boolean;
};

const webTestIdSelector = (id: string) => `[data-testid="${id}"]`;

export class ElementHandle {
  private readonly selector: string;
  private readonly parent?: ElementHandle;
  private readonly webview?: Webview;

  constructor(selector: string, { parent, webview }: ElementHandleOptions = {}) {
    this.selector = selector;
    this.parent = parent;
    // nested handles inherit the webview of their parent
    this.webview = webview ?? parent?.webview;
  }

  private get wdioElement(): ReturnType<WebdriverIO.Browser["$"]> {
    return this.parent ? this.parent.wdioElement.$(this.selector) : $(this.selector);
  }
  private get wdioElements(): ReturnType<WebdriverIO.Browser["$$"]> {
    return this.parent ? this.parent.wdioElement.$$(this.selector) : $$(this.selector);
  }

  private async ensureContext() {
    const { switchedWebview } = driver.capabilities["custom:state"];
    if (this.webview && this.webview.title === switchedWebview?.title) return; // Already in the target webview; do nothing
    if (switchedWebview) await switchToNativeApp(); // Leave the current webview first
    if (this.webview) await switchToWebview(this.webview); // Switch to the target webview if specified
  }

  nestedBy(selector: string) {
    return new ElementHandle(selector, { parent: this });
  }

  nestedById(id: string) {
    const selector = byId(id).selector;
    return new ElementHandle(selector, { parent: this });
  }

  nestedWebById(id: string) {
    const selector = webTestIdSelector(id);
    return new ElementHandle(selector, { parent: this });
  }

  async waitVisible(timeout = TIMEOUT.xxlarge) {
    await this.ensureContext();
    await this.wdioElement.waitForDisplayed({ timeout });
  }

  async waitNotVisible(timeout = TIMEOUT.xxlarge) {
    await this.ensureContext();
    await this.wdioElement.waitForDisplayed({ timeout, reverse: true });
  }

  async waitExist(timeout = TIMEOUT.xxlarge) {
    await this.ensureContext();
    await this.wdioElement.waitForExist({ timeout });
  }

  async waitNotExist(timeout = TIMEOUT.xxlarge) {
    await this.ensureContext();
    await this.wdioElement.waitForExist({ timeout, reverse: true });
  }

  async tap() {
    await this.ensureContext();
    await this.wdioElement.tap();
  }

  async getText() {
    await this.ensureContext();
    return await this.wdioElement.getText();
  }

  async getAllTexts() {
    await this.ensureContext();
    return await this.wdioElements.map(element => element.getText());
  }

  async count() {
    await this.ensureContext();
    return (await this.wdioElements).length;
  }

  async replaceText(text: string, options: ReplaceTextOptions = {}) {
    await this.ensureContext();
    await this.waitVisible();
    await this.wdioElement.clearValue();
    if (options.incremental) {
      for (const char of text) {
        await this.wdioElement.addValue(char);
        await driver.pause(100);
      }
    } else {
      await this.wdioElement.addValue(text);
    }
  }

  async isVisible() {
    await this.ensureContext();
    return await this.wdioElement.isDisplayed();
  }

  async expectVisible(timeout = TIMEOUT.xxlarge) {
    await this.ensureContext();
    await expect(this.wdioElement).toBeDisplayed({ wait: timeout });
  }

  async expectText(text: string, options: ExpectTextOptions = {}) {
    const { containing, ignoreCase } = options;
    if (options.normaliseWhitespace) {
      text = text.replaceAll(/\s+/g, " ").replaceAll("\u200B", "").trim();
    }
    await this.ensureContext();
    await this.waitVisible();
    await expect(this.wdioElement).toHaveText(text, { containing, ignoreCase });
  }

  async expectTextMatching(pattern: RegExp, timeout = TIMEOUT.xxlarge) {
    await this.ensureContext();
    await expect(this.wdioElement).toHaveText(pattern, { wait: timeout });
  }
}

export const by = (selector: string) => {
  return new ElementHandle(selector);
};

export const byId = (id: string) => {
  const selector = driver.isAndroid ? `android=new UiSelector().resourceId("${id}")` : `~${id}`;
  return new ElementHandle(selector);
};

export const byIdMatching = (pattern: RegExp) => {
  const selector = driver.isAndroid
    ? `android=new UiSelector().resourceIdMatches("${pattern.source}")`
    : `-ios predicate string:name MATCHES "${pattern.source}"`;
  return new ElementHandle(selector);
};

export const webBy = (selector: string, webview: Webview) => {
  return new ElementHandle(selector, { webview });
};

export const webById = (id: string, webview: Webview) => {
  const selector = webTestIdSelector(id);
  return new ElementHandle(selector, { webview });
};
