// @flow
import { Platform } from "react-native";
import { createStackNavigator } from "react-navigation-stack";
import { closableStackNavigatorConfig } from "../../../navigation/navigatorConfig";

import DelegationStarted from "./Started";
import DelegationSummary from "./Summary";
import DelegationSelectValidator from "./SelectValidator";
import DelegationConnectDevice from "./ConnectDevice";
import DelegationValidation from "./Validation";
import DelegationValidationSuccess from "./ValidationSuccess";
import DelegationValidationError from "./ValidationError";

const DelegationFlow = createStackNavigator(
  {
    // $FlowFixMe
    DelegationStarted,
    DelegationSummary,
    DelegationSelectValidator,
    DelegationConnectDevice,
    DelegationValidation,
    DelegationValidationSuccess,
    DelegationValidationError,
  },
  closableStackNavigatorConfig,
);

DelegationFlow.navigationOptions = ({ navigation }) => ({
  header: null,
  gesturesEnabled:
    Platform.OS === "ios"
      ? navigation.getParam("allowNavigation", true)
      : false,
});

export default DelegationFlow;
