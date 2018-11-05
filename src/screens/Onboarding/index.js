// @flow

import { createStackNavigator } from "react-navigation";

import OnboardingStep01Welcome from "./01-welcome";
import OnboardingStep02GetStarted from "./02-get-started";
import OnboardingStep03ChooseDevice from "./03-choose-device";
import OnboardingStep04SetupPin from "./04-setup-pin";
import OnboardingStep05WriteRecovery from "./05-write-recovery";
import OnboardingStep06SecurityChecklist from "./06-security-checklist";
import OnboardingStep07PairNew from "./07-pair-new";
import OnboardingStep08Password from "./08-password";
import OnboardingStep09ShareData from "./09-share-data";
import OnboardingStep10Finish from "./10-finish";

const Onboarding = createStackNavigator({
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

Onboarding.navigationOptions = {
  header: null,
};

export default Onboarding;
