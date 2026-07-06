import path from "node:path";
import { unlinkSync, copyFileSync } from "node:fs";

import { OnboardingPage } from "./onboarding.page.ts";
import { SpeculosPage } from "./speculos.page.ts";
import { PortfolioPage } from "./portfolio.page.ts";
import { SwapPage } from "./swap.page.ts";
import { SwapLiveAppPage } from "./swap-live-app.page.ts";
import { ModularDrawerPage } from "./modular-drawer.page.ts";
import { CommonPage } from "./common.page.ts";
import { EarnPage } from "./earn.page.ts";
import { EarnLiveAppPage } from "./earn-live-app.page.ts";

import {
  InitializationManager,
  InitOptions,
} from "../utils/InitialisationManager.ts";
import { randomUUID } from "node:crypto";

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

  private onboardingPageInstance = Pages.LAZY_INIT(OnboardingPage);
  private speculosPageInstance = Pages.LAZY_INIT(SpeculosPage);
  private portfolioPageInstance = Pages.LAZY_INIT(PortfolioPage);
  private swapPageInstance = Pages.LAZY_INIT(SwapPage);
  private swapLiveAppPageInstance = Pages.LAZY_INIT(SwapLiveAppPage);
  private modularDrawerInstance = Pages.LAZY_INIT(ModularDrawerPage);
  private commonPageInstance = Pages.LAZY_INIT(CommonPage);
  private earnPageInstance = Pages.LAZY_INIT(EarnPage);
  private earnLiveAppPageInstance = Pages.LAZY_INIT(EarnLiveAppPage);

  async init(options: InitOptions) {
    // TODO: move this into initialisation manager?
    // this.modularDrawer.resetFlags(); TODO: REVIEW
    const userDataString = `temp-userdata-${randomUUID()}`;
    const userDataPathSpeculos = path.resolve(
      "userdata",
      `${userDataString}.json`,
    );
    const userDataTest = path.resolve(
      "userdata",
      `${options.userdata || "skip-onboarding"}.json`,
    );

    copyFileSync(userDataTest, userDataPathSpeculos);
    try {
      await InitializationManager.initialize(
        options,
        userDataPathSpeculos,
        userDataString,
      );
    } finally {
      unlinkSync(userDataPathSpeculos);
    }
  }

  public get onboarding() {
    return this.onboardingPageInstance();
  }

  public get speculos() {
    return this.speculosPageInstance();
  }

  public get portfolio() {
    return this.portfolioPageInstance();
  }

  public get swap() {
    return this.swapPageInstance();
  }

  public get earn() {
    return this.earnPageInstance();
  }

  public get earnLiveApp() {
    return this.earnLiveAppPageInstance();
  }

  public get swapLiveApp() {
    return this.swapLiveAppPageInstance();
  }

  public get modularDrawer() {
    return this.modularDrawerInstance();
  }

  public get common() {
    return this.commonPageInstance();
  }
}

export default new Pages();
