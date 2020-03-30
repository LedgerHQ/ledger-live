// @flow
import { Platform } from "react-native";
import { createStackNavigator } from "react-navigation-stack";
import i18next from "i18next";
import { closableStackNavigatorConfig } from "../../../navigation/navigatorConfig";

import VoteStarted from "./Started";

import VoteSelectValidator from "./01-SelectValidator";
import CastVote from "./02-CastVote";
import VoteConnectDevice from "./03-ConnectDevice";
import VoteValidation from "./04-Validation";
import VoteValidationError from "./04-ValidationError";
import VoteValidationSuccess from "./04-ValidationSuccess";

const VoteFlow = createStackNavigator(
  {
    VoteStarted: {
      // $FlowFixMe
      screen: VoteStarted,
      navigationOptions: {
        title: i18next.t("tron.voting.flow.started.title"),
      },
    },
    VoteSelectValidator,
    CastVote,
    VoteConnectDevice,
    VoteValidation,
    VoteValidationError,
    VoteValidationSuccess,
  },
  closableStackNavigatorConfig,
);

VoteFlow.navigationOptions = ({ navigation }) => ({
  header: null,
  gesturesEnabled:
    Platform.OS === "ios"
      ? navigation.getParam("allowNavigation", true)
      : false,
});

export default VoteFlow;
