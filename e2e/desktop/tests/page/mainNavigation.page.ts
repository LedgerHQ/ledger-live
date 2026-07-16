import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { Drawer } from "tests/component/drawer.component";
import { Layout } from "tests/component/layout.component";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { MyWalletPage } from "./myWallet.page";
import { isAssetSectionEnabled, isMyWalletEnabled } from "tests/utils/featureFlagUtils";

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
  private readonly myWallet = new MyWalletPage(this.page);
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

  private async getSidebarTargets(): Promise<Readonly<Record<TargetName, NavigationTarget>>> {
    return {
      home: {
        expectActive: true,
        selector: this.homeSideBarButton,
      },
      accounts: {
        expectActive: true,
        // Asset Section ON routes to /cryptos; OFF redirects to the legacy /accounts page.
        expectedPath: (await isAssetSectionEnabled(this.page))
          ? /^\/cryptos(?:\/|$|\?)/
          : /^\/accounts(?:\/|$|\?)/,
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
    // With My Wallet ON, "refer a friend" is removed from the sidebar and lives in the My Wallet popover.
    if (target === "refer a friend" && (await isMyWalletEnabled(this.page))) {
      await this.myWallet.openMyWalletPopover();
      await this.myWallet.clickReferralTile();
    } else {
      const { selector } = (await this.getSidebarTargets())[target];
      await expect(selector).toBeEnabled();
      await selector.click();
    }
  }

  @step("Validate $0 target from main navigation is selected and redirect to the expected path")
  async validateTargetFromMainNavigation(target: TargetName) {
    const targetConfig = (await this.getSidebarTargets())[target];

    // The My Wallet popover refer entry navigates without leaving a persistent active sidebar item.
    const expectActive =
      targetConfig.expectActive &&
      !(target === "refer a friend" && (await isMyWalletEnabled(this.page)));

    if (expectActive) {
      await expect(targetConfig.selector).toHaveAttribute("aria-current", "page");
    }

    if (targetConfig.expectedPath) {
      await this.expectPath(targetConfig.expectedPath);
    }
  }

  /**
   * Trigger a top-navigation action that, with My Wallet ON, moves from the topbar into the
   * My Wallet popover. Falls back to the legacy topbar button when My Wallet is OFF.
   */
  private async triggerTopNavigationAction(
    popoverAction: () => Promise<void>,
    legacyTopbarButton: Locator,
  ) {
    if (await isMyWalletEnabled(this.page)) {
      await this.myWallet.openMyWalletPopover();
      await popoverAction();
    } else {
      await legacyTopbarButton.click();
    }
  }

  @step("Open Notification center from top navigation")
  async openNotificationCenter() {
    await this.triggerTopNavigationAction(
      () => this.myWallet.clickNotificationsFromPopover(),
      this.layout.topbarNotificationButton,
    );
    await expect(this.drawer.content).toBeVisible();
    await this.drawer.closeDrawer();
  }

  @step("Click Activity indicator from top navigation")
  async clickActivityIndicator() {
    await this.layout.waitForSyncButtonToBeEnabled();
    await this.layout.topbarSynchronizeButton.click();
  }

  @step("Open My Ledger from top navigation")
  async openMyLedger() {
    await this.triggerTopNavigationAction(
      () => this.myWallet.clickMyLedgerFromPopover(),
      this.layout.topbarMyLedgerButton,
    );
    await this.expectPath(/^\/manager(?:\/|$|\?)/);
  }

  @step("Open Settings from top navigation")
  async openSettings() {
    await this.triggerTopNavigationAction(
      () => this.myWallet.clickSettingsFromPopover(),
      this.layout.topbarSettingsButton,
    );
    await this.expectPath(/^\/settings(?:\/|$|\?)/);
  }
}
