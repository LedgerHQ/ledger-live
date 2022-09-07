export type Step = {
  id: string;
  isGhost?: boolean;
};
export type OnboardingContextType = {
  // contains the id of the current step, used to know
  // which step is next/prev
  currentStep: string;
  // list of the currently active steps
  mode: OnboardingMode;
  deviceModelId: DeviceNames;
  showWelcome: boolean;
  setShowWelcome: (_: boolean) => Promise<void>;
  firstTimeOnboarding?: boolean;
  setFirstTimeOnboarding: (_: boolean) => Promise<void>;
  // allow to change the steps on the fly
  // e.g: skip (& hide) steps if device is already initialized
  setOnboardingMode: SetOnboardingModeType | Noop;
  setOnboardingDeviceModel: SetOnboardingDeviceModelType | Noop;
  // change screen to prev/next, sync navigation & state
  nextWithNavigation: StepNavigateType;
  prevWithNavigation: StepNavigateType;
  syncNavigation: Noop;
  // reset to step 0 of current mode
  resetCurrentStep: Noop;
};
export type OnboardingStepProps = OnboardingContextType & {
  t: any;
  navigation: any;
  next: Noop;
  prev: Noop;
};
export type SetOnboardingModeType = (_: OnboardingMode) => Promise<void>;
export type SetOnboardingDeviceModelType = (_: DeviceNames) => Promise<void>;
export type OnboardingContextProviderProps = {
  children: any;
};
type OnboardingMode = "full" | "alreadyInitialized" | "restore" | "qr";
export type DeviceNames = "nanoS" | "nanoX" | "blue";
type StepNavigateType = (arg0: any, arg1: any) => void;
type Noop = (_: any) => any;
