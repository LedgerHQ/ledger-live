import { OnboardingPage } from "./onboarding.page.ts";

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

  public get onboarding() {
    return this.onboardingPageInstance();
  }
}

export default new Pages();
