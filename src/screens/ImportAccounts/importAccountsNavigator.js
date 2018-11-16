import { createStackNavigator } from "react-navigation";

import ScanAccounts from "./Scan";
import DisplayResult from "./DisplayResult";
import FallBackCameraScreen from "./FallBackCameraScreen";
import TransparentHeaderNavigationOptions from "../../navigation/TransparentHeaderNavigationOptions";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";

const ImportAccounts = createStackNavigator(
  {
    ScanAccounts: {
      screen: ScanAccounts,
      navigationOptions: TransparentHeaderNavigationOptions,
    },
    DisplayResult,
    FallBackCameraScreen,
  },
  closableStackNavigatorConfig,
);

ImportAccounts.navigationOptions = {
  header: null,
};

export default ImportAccounts;
