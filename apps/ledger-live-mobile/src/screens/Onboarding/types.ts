import { DeviceModelId } from "@ledgerhq/types-devices";
import { NavigationProp } from "@react-navigation/native";
import { TFunction } from "i18next";

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
  deviceModelId: DeviceModelId;
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
  t: TFunction;
  navigation: NavigationProp<{ [key: string]: object | unknown }>;
  next: Noop;
  prev: Noop;
};
export type SetOnboardingModeType = (_: OnboardingMode) => Promise<void>;
export type SetOnboardingDeviceModelType = (_: DeviceModelId) => Promise<void>;
export type OnboardingContextProviderProps = {
  children: React.ReactNode;
};
export type OnboardingMode = "full" | "alreadyInitialized" | "restore" | "qr";
type StepNavigateType = (
  arg0: NavigationProp<{ [key: string]: object | unknown }>,
  arg1: string,
) => void;
// Seems ok to use any for this wildcard function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Noop = (...args: any[]) => void;
