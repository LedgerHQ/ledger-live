import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { Drawer } from "tests/component/drawer.component";
import { Layout } from "tests/component/layout.component";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";

type NavigationTarget = {
  readonly expectedPath?: RegExp;
  readonly expectActive: boolean;
  readonly selector: Locator;
};

export type TargetName =
  | "home"
  | "accounts"
  | "swap"
  | "earn"
  | "discover"
  | "refer a friend"
  | "card";

export class MainNavigationPage extends AppPage {
  private readonly drawer = new Drawer(this.page);
  private readonly layout = new Layout(this.page);
  private readonly sidebarNavigation = this.page.getByTestId("sidebar-navigation");

  private readonly homeSideBarButton = this.sidebarNavigation.getByRole("button", { name: "home" });
  private readonly accountsSideBarButton = this.sidebarNavigation.getByRole("button", {
    name: "accounts",
  });
  private readonly swapSideBarButton = this.sidebarNavigation.getByRole("button", { name: "swap" });
  private readonly earnSideBarButton = this.sidebarNavigation.getByRole("button", {
    name: /^(earn|stake|yield)$/i,
  });
  private readonly discoverSideBarButton = this.sidebarNavigation.getByRole("button", {
    name: "discover",
  });
  private readonly referAFriendSideBarButton = this.sidebarNavigation.getByRole("button", {
    name: "refer a friend",
  });
  private readonly cardSideBarButton = this.sidebarNavigation.getByRole("button", { name: "card" });

  private async expectPath(expectedPath: RegExp) {
    await expect(this.page).toHaveURL(url => {
      const hashPath = url.hash.replace(/^#/, "");
      const currentPath = hashPath.startsWith("/") ? hashPath : `${url.pathname}${url.search}`;
      return expectedPath.test(currentPath);
    });
  }

  private get sidebarTargets(): Readonly<Record<TargetName, NavigationTarget>> {
    return {
      home: {
        expectActive: true,
        selector: this.homeSideBarButton,
      },
      accounts: {
        expectActive: true,
        expectedPath: /^\/cryptos(?:\/|$|\?)/,
        selector: this.accountsSideBarButton,
      },
      swap: {
        expectActive: true,
        expectedPath: /^\/swap(?:\/|$|\?)/,
        selector: this.swapSideBarButton,
      },
      earn: {
        expectActive: true,
        expectedPath: /^\/earn(?:\/|$|\?)/,
        selector: this.earnSideBarButton,
      },
      discover: {
        expectActive: true,
        expectedPath: /^\/platform(?:\/|$|\?)/,
        selector: this.discoverSideBarButton,
      },
      "refer a friend": {
        expectActive: true,
        expectedPath: /^\/platform\/refer-a-friend(?:\/|$|\?)/,
        selector: this.referAFriendSideBarButton,
      },
      card: {
        expectActive: true,
        expectedPath: /^\/card-new-wallet(?:\/|$|\?)/,
        selector: this.cardSideBarButton,
      },
    };
  }
  @step("Open $0 from main navigation")
  async openTargetFromMainNavigation(target: TargetName) {
    const { selector } = this.sidebarTargets[target];
    await expect(selector).toBeEnabled();
    await selector.click();
  }

  @step("Validate $0 target from main navigation is selected and redirect to the expected path")
  async validateTargetFromMainNavigation(target: TargetName) {
    const targetConfig = this.sidebarTargets[target];
    if (targetConfig.expectActive) {
      await expect(targetConfig.selector).toHaveAttribute("aria-current", "page");
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

  @step("Open My Ledger from top navigation")
  async openMyLedger() {
    await this.layout.topbarMyLedgerButton.click();
    await this.expectPath(/^\/manager(?:\/|$|\?)/);
  }

  @step("Open Settings from top navigation")
  async openSettings() {
    await this.layout.topbarSettingsButton.click();
    await this.expectPath(/^\/settings(?:\/|$|\?)/);
  }
}
