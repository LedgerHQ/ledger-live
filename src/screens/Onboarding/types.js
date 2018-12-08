// @flow

import type { NavigationScreenProp } from "react-navigation";

export type Step = {
  id: string,
  isGhost?: boolean,
};

export type OnboardingContextType = {
  // contains the id of the current step, used to know
  // which step is next/prev
  currentStep: string,

  // list of the currently active steps
  mode: OnboardingMode,

  showWelcome: boolean,
  setShowWelcome: boolean => Promise<void>,

  // allow to change the steps on the fly
  // e.g: skip (& hide) steps if device is already initialized
  setOnboardingMode: SetOnboardingModeType | Noop,

  // change screen to prev/next, sync navigation & state
  nextWithNavigation: StepNavigateType,
  prevWithNavigation: StepNavigateType,

  // reset to step 0 of current mode
  resetCurrentStep: Noop,
};

export type OnboardingStepProps = OnboardingContextType & {
  t: *,
  navigation: NavigationScreenProp<*>,
  next: Noop,
  prev: Noop,
};

export type SetOnboardingModeType = OnboardingMode => Promise<void>;

export type OnboardingContextProviderProps = { children: * };

type OnboardingMode = "full" | "alreadyInitialized" | "qrcode" | "restore";

type StepNavigateType = (NavigationScreenProp<*>) => void;
type Noop = any => any;
