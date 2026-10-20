import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { Drawer } from "tests/component/drawer.component";
import { Layout } from "tests/component/layout.component";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import { MyWalletPage } from "tests/page/myWallet.page";
import { isAssetSectionEnabled } from "tests/utils/featureFlagUtils";

type NavigationTarget = {
  readonly expectedPath?: RegExp;
  readonly selector: Locator;
};

type SidebarTargetName = "home" | "accounts" | "swap" | "earn" | "discover" | "card" | "pay";

export type TargetName = SidebarTargetName | "refer a friend";

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
  private readonly cardSideBarButton = this.sidebarNavigation.getByRole("button", { name: "card" });
  // With `lwdPayTab` on, the sidebar swaps the Card entry for this one. The two are mutually
  // exclusive, so a spec that enables the flag must target "pay", not "card".
  private readonly paySideBarButton = this.sidebarNavigation.getByRole("button", {
    name: "pay",
  });

  private async expectPath(expectedPath: RegExp) {
    await expect(this.page).toHaveURL(url => {
      const hashPath = url.hash.replace(/^#/, "");
      const currentPath = hashPath.startsWith("/") ? hashPath : `${url.pathname}${url.search}`;
      return expectedPath.test(currentPath);
    });
  }

  private async getSidebarTargets(): Promise<
    Readonly<Record<SidebarTargetName, NavigationTarget>>
  > {
    return {
      home: {
        selector: this.homeSideBarButton,
      },
      accounts: {
        // Asset Section ON routes to /cryptos; OFF redirects to the legacy /accounts page.
        expectedPath: (await isAssetSectionEnabled(this.page))
          ? /^\/cryptos(?:\/|$|\?)/
          : /^\/accounts(?:\/|$|\?)/,
        selector: this.accountsSideBarButton,
      },
      swap: {
        expectedPath: /^\/swap(?:\/|$|\?)/,
        selector: this.swapSideBarButton,
      },
      earn: {
        expectedPath: /^\/earn(?:\/|$|\?)/,
        selector: this.earnSideBarButton,
      },
      discover: {
        expectedPath: /^\/platform(?:\/|$|\?)/,
        selector: this.discoverSideBarButton,
      },
      card: {
        expectedPath: /^\/card-new-wallet(?:\/|$|\?)/,
        selector: this.cardSideBarButton,
      },
      pay: {
        expectedPath: /^\/paytab(?:\/|$|\?)/,
        selector: this.paySideBarButton,
      },
    };
  }
  @step("Open $0 from main navigation")
  async openTargetFromMainNavigation(target: TargetName) {
    if (target === "refer a friend") {
      await this.myWallet.openMyWalletPopover();
      await this.myWallet.clickReferralTile();
      return;
    }

    const { selector } = (await this.getSidebarTargets())[target];
    await expect(selector).toBeEnabled();
    await selector.click();
  }

  @step("Expect $0 to be disabled in main navigation")
  async expectTargetDisabled(target: SidebarTargetName) {
    const { selector } = (await this.getSidebarTargets())[target];
    await expect(selector).toBeDisabled();
  }

  @step("Validate $0 target from main navigation is selected and redirect to the expected path")
  async validateTargetFromMainNavigation(target: TargetName) {
    if (target === "refer a friend") {
      await this.expectPath(/^\/platform\/refer-a-friend(?:\/|$|\?)/);
      return;
    }

    const targetConfig = (await this.getSidebarTargets())[target];
    await expect(targetConfig.selector).toHaveAttribute("aria-current", "page");

    if (targetConfig.expectedPath) {
      await this.expectPath(targetConfig.expectedPath);
    }
  }

  @step("Open Notification center from top navigation")
  async openNotificationCenter() {
    await this.myWallet.openMyWalletPopover();
    await this.myWallet.clickNotificationsFromPopover();
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
    await this.myWallet.openMyWalletPopover();
    await this.myWallet.clickMyLedgerFromPopover();
    await this.expectPath(/^\/manager(?:\/|$|\?)/);
  }

  @step("Open Settings from top navigation")
  async openSettings() {
    await this.myWallet.openMyWalletPopover();
    await this.myWallet.clickSettingsFromPopover();
    await this.expectPath(/^\/settings(?:\/|$|\?)/);
  }
}
