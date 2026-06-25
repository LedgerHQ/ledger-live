/**
 * Page-object aggregator for the Detox Next Gen suite.
 *
 * Specs import a single `app` instance and reach every screen through it:
 *
 *   import { app } from "../pages";
 *   await app.wallet.openTransferMenu();
 *   await app.transferMenu.tapReceive();
 *
 * Pages are lazily instantiated — a page object is constructed only the
 * first time it's used, so adding screens here is free for specs that
 * don't touch them.
 *
 * Layering: specs → page objects (here) → `helpers/elements` (element
 * primitives) → raw Detox. App-specific knowledge lives in the pages; the
 * elements lib stays generic.
 */
import { CommonPage } from "./common.page";
import { WalletPage } from "./wallet.page";
import { TransferMenuDrawer } from "./transferMenu.drawer";
import { ModularDrawer } from "./modular.drawer";
import { ReceivePage } from "./receive.page";
import { SwapPage } from "./swap.page";
import { SwapLiveAppPage } from "./swapLiveApp.page";

/** Build a lazy singleton factory for a page class. */
const lazy = <T>(PageClass: new () => T): (() => T) => {
  let instance: T | null = null;
  return () => {
    if (!instance) instance = new PageClass();
    return instance;
  };
};

export class Application {
  private readonly commonPage = lazy(CommonPage);
  private readonly walletPage = lazy(WalletPage);
  private readonly transferMenuDrawer = lazy(TransferMenuDrawer);
  private readonly modularDrawerPage = lazy(ModularDrawer);
  private readonly receivePage = lazy(ReceivePage);
  private readonly swapPage = lazy(SwapPage);
  private readonly swapLiveAppPage = lazy(SwapLiveAppPage);

  get common(): CommonPage {
    return this.commonPage();
  }
  get wallet(): WalletPage {
    return this.walletPage();
  }
  get transferMenu(): TransferMenuDrawer {
    return this.transferMenuDrawer();
  }
  get modularDrawer(): ModularDrawer {
    return this.modularDrawerPage();
  }
  get receive(): ReceivePage {
    return this.receivePage();
  }
  get swap(): SwapPage {
    return this.swapPage();
  }
  get swapLiveApp(): SwapLiveAppPage {
    return this.swapLiveAppPage();
  }
}

/** Shared application instance — import this in specs. */
export const app = new Application();
