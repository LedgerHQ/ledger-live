// @flow

import { createStackNavigator } from "react-navigation";

import OnboardingStep01Welcome from "./steps/01-welcome";
import OnboardingStep02GetStarted from "./steps/02-get-started";
import OnboardingStep03ChooseDevice from "./steps/03-choose-device";
import OnboardingStep04SetupPin from "./steps/04-setup-pin";
import OnboardingStep05WriteRecovery from "./steps/05-write-recovery";
import OnboardingStep06SecurityChecklist from "./steps/06-security-checklist";
import OnboardingStep07PairNew from "./steps/07-pair-new";
import OnboardingStep08Password from "./steps/08-password";
import OnboardingStep09ShareData from "./steps/09-share-data";
import OnboardingStep10Finish from "./steps/10-finish";

const OnboardingStack = createStackNavigator({
  OnboardingStep01Welcome,
  OnboardingStep02GetStarted,
  OnboardingStep03ChooseDevice,
  OnboardingStep04SetupPin,
  OnboardingStep05WriteRecovery,
  OnboardingStep06SecurityChecklist,
  OnboardingStep07PairNew,
  OnboardingStep08Password,
  OnboardingStep09ShareData,
  OnboardingStep10Finish,
});

OnboardingStack.navigationOptions = { header: null };

export default OnboardingStack;
