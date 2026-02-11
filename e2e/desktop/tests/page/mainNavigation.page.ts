import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { Drawer } from "tests/component/drawer.component";
import { Layout } from "tests/component/layout.component";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

type NavigationTarget = {
  readonly expectedPath?: RegExp;
  readonly expectActive: boolean;
  readonly selector: () => Locator;
};

export type TargetName =
  | "portfolio"
  | "accounts"
  | "swap"
  | "earn"
  | "discover"
  | "refer a friend"
  | "card";

export class MainNavigationPage extends AppPage {
  private readonly drawer = new Drawer(this.page);
  private readonly layout = new Layout(this.page);
  private readonly sideBarButton: (name: TargetName) => Locator = name =>
    this.page.getByRole("button", { name: new RegExp(`^${name}$`, "i") });

  private async expectPath(expectedPath: RegExp) {
    await expect(this.page).toHaveURL(url => {
      const hashPath = url.hash.replace(/^#/, "");
      const currentPath = hashPath.startsWith("/") ? hashPath : `${url.pathname}${url.search}`;
      return expectedPath.test(currentPath);
    });
  }

  private get sidebarTargets(): Readonly<Record<TargetName, NavigationTarget>> {
    return {
      portfolio: {
        expectActive: true,
        selector: () => this.sideBarButton("portfolio"),
      },
      accounts: {
        expectActive: true,
        expectedPath: /^\/accounts(?:\/|$|\?)/,
        selector: () => this.sideBarButton("accounts"),
      },
      swap: {
        expectActive: true,
        expectedPath: /^\/swap(?:\/|$|\?)/,
        selector: () => this.sideBarButton("swap"),
      },
      earn: {
        expectActive: true,
        expectedPath: /^\/earn(?:\/|$|\?)/,
        selector: () => this.page.getByRole("button", { name: /^(earn|stake)$/i }),
      },
      discover: {
        expectActive: true,
        expectedPath: /^\/platform(?:\/|$|\?)/,
        selector: () => this.sideBarButton("discover"),
      },
      "refer a friend": {
        expectActive: true,
        expectedPath: /^\/platform\/refer-a-friend(?:\/|$|\?)/,
        selector: () => this.sideBarButton("refer a friend"),
      },
      card: {
        expectActive: true,
        expectedPath: /^\/card-new-wallet(?:\/|$|\?)/,
        selector: () => this.sideBarButton("card"),
      },
    };
  }
  @step("Open $0 from main navigation")
  async openTargetFromMainNavigation(target: TargetName) {
    await this.sidebarTargets[target].selector().click();
  }

  @step("Validate $0 target from main navigation is selected and redirect to the expected path")
  async validateTargetFromMainNavigation(target: TargetName) {
    const targetConfig = this.sidebarTargets[target];
    if (targetConfig.expectActive) {
      await expect(targetConfig.selector()).toHaveAttribute("aria-current", "page");
    }

    if (targetConfig.expectedPath) {
      await this.expectPath(targetConfig.expectedPath);
    }
  }

  @step("Open Notification center from top navigation")
  async openNotificationCenter() {
    await this.layout.topbarNotificationButton.click();
    await expect(this.drawer.content).toBeVisible();
    await this.drawer.closeDrawer();
  }

  @step("Click Activity indicator from top navigation")
  async clickActivityIndicator() {
    await this.layout.topbarSynchronizeButton.click();
  }

  @step("Open Settings from top navigation")
  async openSettings() {
    await this.layout.topbarSettingsButton.click();
    await this.expectPath(/^\/settings(?:\/|$|\?)/);
  }
}
