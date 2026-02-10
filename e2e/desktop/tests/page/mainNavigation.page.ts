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

export class MainNavigationPage extends AppPage {
  private drawer = new Drawer(this.page);
  private layout = new Layout(this.page);
  private readonly sideBarButton: (name: string) => Locator = name =>
    this.page.getByRole("button", { name: new RegExp(`^${name}$`, "i") });

  private async expectPath(expectedPath: RegExp) {
    await expect(this.page).toHaveURL(url => {
      const hashPath = url.hash.replace(/^#/, "");
      const currentPath = hashPath.startsWith("/") ? hashPath : `${url.pathname}${url.search}`;
      return expectedPath.test(currentPath);
    });
  }

  private get sidebarTargets(): ReadonlyArray<NavigationTarget> {
    return [
      {
        expectActive: true,
        selector: () => this.sideBarButton("portfolio"),
      },
      {
        expectActive: true,
        expectedPath: /^\/accounts(?:\/|$|\?)/,
        selector: () => this.sideBarButton("accounts"),
      },
      {
        expectActive: true,
        expectedPath: /^\/swap(?:\/|$|\?)/,
        selector: () => this.sideBarButton("swap"),
      },
      {
        expectActive: true,
        expectedPath: /^\/earn(?:\/|$|\?)/,
        selector: () => this.page.getByRole("button", { name: /^(earn|stake)$/i }),
      },
      {
        expectActive: true,
        expectedPath: /^\/platform(?:\/|$|\?)/,
        selector: () => this.sideBarButton("discover"),
      },
      {
        expectActive: true,
        expectedPath: /^\/platform\/refer-a-friend(?:\/|$|\?)/,
        selector: () => this.sideBarButton("refer a friend"),
      },
      {
        expectActive: true,
        expectedPath: /^\/card-new-wallet(?:\/|$|\?)/,
        selector: () => this.sideBarButton("card"),
      },
    ];
  }

  private async verifySidebarTarget(target: NavigationTarget) {
    const clickedItem = target.selector().first();
    await clickedItem.click();

    if (target.expectActive) {
      await expect(clickedItem).toHaveAttribute("aria-current", "page");
    }

    if (target.expectedPath) {
      await this.expectPath(target.expectedPath);
    }
  }

  @step("Open Portfolio from main navigation")
  async verifyPortfolioNavigation() {
    await this.verifySidebarTarget(this.sidebarTargets[0]);
  }

  @step("Open Accounts from main navigation")
  async verifyAccountsNavigation() {
    await this.verifySidebarTarget(this.sidebarTargets[1]);
  }

  @step("Open Swap from main navigation")
  async verifySwapNavigation() {
    await this.verifySidebarTarget(this.sidebarTargets[2]);
  }

  @step("Open Earn from main navigation")
  async verifyEarnNavigation() {
    await this.verifySidebarTarget(this.sidebarTargets[3]);
  }

  @step("Open Discover from main navigation")
  async verifyDiscoverNavigation() {
    await this.verifySidebarTarget(this.sidebarTargets[4]);
  }

  @step("Open Refer a friend from main navigation")
  async verifyReferAFriendNavigation() {
    await this.verifySidebarTarget(this.sidebarTargets[5]);
  }

  @step("Open Card from main navigation")
  async verifyCardNavigation() {
    await this.verifySidebarTarget(this.sidebarTargets[6]);
  }

  @step("Open Notification center from top navigation")
  async verifyNotificationCenterNavigation() {
    await this.layout.topbarNotificationButton.click();
    await expect(this.drawer.content).toBeVisible();
    await this.drawer.closeDrawer();
  }

  @step("Click Activity indicator from top navigation")
  async verifyActivityIndicatorNavigation() {
    await this.layout.topbarSynchronizeButton.click();
  }

  @step("Open Settings from top navigation")
  async verifySettingsNavigation() {
    await this.layout.topbarSettingsButton.click();
    await this.expectPath(/^\/settings(?:\/|$|\?)/);
  }
}
