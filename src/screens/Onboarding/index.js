// @flow

import { createStackNavigator } from "react-navigation";

import OnboardingStepGetStarted from "./steps/get-started";
import OnboardingStepChooseDevice from "./steps/choose-device";
import OnboardingStepSetupPin from "./steps/setup-pin";
import OnboardingStepWriteRecovery from "./steps/write-recovery";
import OnboardingStepSecurityChecklist from "./steps/security-checklist";
import OnboardingStepPairNew from "./steps/pair-new";
import OnboardingStepPassword from "./steps/password";
import OnboardingStepShareData from "./steps/share-data";
import OnboardingStepScanQR from "./steps/scan-qr";
import OnboardingStepFinish from "./steps/finish";

const OnboardingStack = createStackNavigator({
  OnboardingStepGetStarted,
  OnboardingStepChooseDevice,
  OnboardingStepSetupPin,
  OnboardingStepWriteRecovery,
  OnboardingStepSecurityChecklist,
  OnboardingStepPairNew,
  OnboardingStepScanQR,
  OnboardingStepPassword,
  OnboardingStepShareData,
  OnboardingStepFinish,
});

OnboardingStack.navigationOptions = { header: null };

export default OnboardingStack;
