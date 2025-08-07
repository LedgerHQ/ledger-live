import { Component } from "../page/abstractClasses";
import { step } from "../misc/reporters/step";
import { Account, getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";

export class Drawer extends Component {
  readonly content = this.page.getByTestId("drawer-content");
  readonly selectAssetTitle = this.page.getByTestId("select-asset-drawer-title").first();
  readonly drawerOverlay = this.page.locator("[data-testid='drawer-overlay'][style='opacity: 1;']");
  private closeButton = this.page.getByTestId("drawer-close-button").first();
  private addAccountButton = this.page.getByTestId("add-account-button");

  @step("Wait for drawer to be visible")
  async waitForDrawerToBeVisible() {
    await this.content.waitFor({ state: "visible" });
    await this.closeButton.waitFor({ state: "visible" });
    await this.drawerOverlay.waitFor({ state: "attached" });
  }

  @step("Close drawer")
  async closeDrawer() {
    await this.closeButton.click();
  }

  public getAccountButton = (accountName: string) =>
    this.page.getByTestId(`account-row-${accountName.toLowerCase()}-0`).first();

  @step("Select account by name")
  async selectAccountByName(account: Account) {
    await this.getAccountButton(account.currency.name)
      .locator(`text=${getParentAccountName(account)}`)
      .click();
  }

  @step("Click on add account button")
  async clickOnAddAccountButton() {
    if (await this.addAccountButton.isVisible()) {
      console.log("Add Account Button is visible, clicking...");
      // Log the add account button HTML before clicking
      const buttonHTML = await this.page.evaluate(() => {
        const addAccountButton = document.querySelector('[data-testid="add-account-button"]');
        if (addAccountButton) {
          return {
            outerHTML: addAccountButton.outerHTML,
            textContent: addAccountButton.textContent,
            innerText: (addAccountButton as HTMLElement).innerText,
            tagName: addAccountButton.tagName,
            className: addAccountButton.className,
            id: addAccountButton.id,
          };
        } else {
          return null;
        }
      });

      if (buttonHTML) {
        console.log("Add Account Button HTML:", buttonHTML.outerHTML);
        console.log("Add Account Button textContent:", buttonHTML.textContent);
        console.log("Add Account Button innerText:", buttonHTML.innerText);
        console.log("Add Account Button tagName:", buttonHTML.tagName);
        console.log("Add Account Button className:", buttonHTML.className);
        console.log("Add Account Button id:", buttonHTML.id);
      } else {
        console.log("Add Account Button: Element not found");
      }

      console.log("Clicking on Add Account Button...");
      await this.addAccountButton.click();
    }
  }

  @step("Log HTML element to console")
  async logElementToConsole(selector: string, description: string = "Element") {
    await this.page.evaluate(
      ({ selector, description }) => {
        const element = document.querySelector(selector);
        if (element) {
          console.log(`${description}:`, element);
          console.log(`${description} HTML:`, element.outerHTML);
          console.log(`${description} textContent:`, element.textContent);
          console.log(`${description} innerText:`, (element as HTMLElement).innerText);
        } else {
          console.log(`${description}: Element not found with selector "${selector}"`);
        }
      },
      { selector, description },
    );
  }

  @step("Log drawer content to console")
  async logDrawerContent() {
    await this.page.evaluate(() => {
      const drawerContent = document.querySelector('[data-testid="drawer-content"]');
      if (drawerContent) {
        console.log("Drawer Content:", drawerContent);
        console.log("Drawer HTML:", drawerContent.outerHTML);
        console.log("Drawer textContent:", drawerContent.textContent);
      } else {
        console.log("Drawer content element not found");
      }
    });
  }
}
