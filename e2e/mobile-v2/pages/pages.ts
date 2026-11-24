import { SpeculosPage } from "@e2e-mobile/pages/speculos.page";
import { PortfolioPage } from "@e2e-mobile/pages/portfolio.page";
import { SwapPage } from "@e2e-mobile/pages/swap.page";
import { SwapLiveAppPage } from "@e2e-mobile/pages/swap-live-app.page";
import { ModularDrawerPage } from "@e2e-mobile/pages/modular-drawer.page";

class Pages {
  private static readonly LAZY_INIT = <T>(PageClass: new () => T) => {
    let instance: T | null = null;
    return () => {
      if (!instance) {
        instance = new PageClass();
      }
      return instance;
    };
  };

  private readonly speculosPageInstance = Pages.LAZY_INIT(SpeculosPage);
  private readonly portfolioPageInstance = Pages.LAZY_INIT(PortfolioPage);
  private readonly swapPageInstance = Pages.LAZY_INIT(SwapPage);
  private readonly swapLiveAppPageInstance = Pages.LAZY_INIT(SwapLiveAppPage);
  private readonly modularDrawerInstance = Pages.LAZY_INIT(ModularDrawerPage);

  public get speculos() {
    return this.speculosPageInstance();
  }

  public get portfolio() {
    return this.portfolioPageInstance();
  }

  public get swap() {
    return this.swapPageInstance();
  }

  public get swapLiveApp() {
    return this.swapLiveAppPageInstance();
  }

  public get modularDrawer() {
    return this.modularDrawerInstance();
  }
}

export default new Pages();
