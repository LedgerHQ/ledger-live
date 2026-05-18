import { OnboardingPage } from "./onboarding.page.ts";

const lazyInit = <T>(PageClass: new () => T) => {
  let instance: T | null = null;
  return () => {
    if (!instance) instance = new PageClass();
    return instance;
  };
};

class Pages {
  private onboardingPageInstance = lazyInit(OnboardingPage);

  public get onboarding() {
    return this.onboardingPageInstance();
  }
}

export default new Pages();
