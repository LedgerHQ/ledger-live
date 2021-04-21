// @flow

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
  deviceModelId: DeviceNames,

  showWelcome: boolean,
  setShowWelcome: boolean => Promise<void>,

  firstTimeOnboarding?: boolean,
  setFirstTimeOnboarding: boolean => Promise<void>,

  // allow to change the steps on the fly
  // e.g: skip (& hide) steps if device is already initialized
  setOnboardingMode: SetOnboardingModeType | Noop,

  setOnboardingDeviceModel: SetOnboardingDeviceModelType | Noop,

  // change screen to prev/next, sync navigation & state
  nextWithNavigation: StepNavigateType,
  prevWithNavigation: StepNavigateType,

  syncNavigation: Noop,

  // reset to step 0 of current mode
  resetCurrentStep: Noop,
};

export type OnboardingStepProps = OnboardingContextType & {
  t: *,
  navigation: *,
  next: Noop,
  prev: Noop,
};

export type SetOnboardingModeType = OnboardingMode => Promise<void>;
export type SetOnboardingDeviceModelType = DeviceNames => Promise<void>;

export type OnboardingContextProviderProps = { children: * };

type OnboardingMode = "full" | "alreadyInitialized" | "restore" | "qr";

export type DeviceNames = "nanoS" | "nanoX" | "blue";

type StepNavigateType = (*, *) => void;
type Noop = any => any;
