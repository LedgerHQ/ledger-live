import { PureComponent } from "react";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { ImportAccountsNavigatorParamList } from "../../components/RootNavigator/types/ImportAccountsNavigator";
import { ScreenName } from "../../const";

type NavigationProps = StackNavigatorProps<
  ImportAccountsNavigatorParamList,
  ScreenName.FallBackCameraScreen
>;

export class FallBackCamera extends PureComponent<NavigationProps> {
  componentDidMount() {
    // TODO do it better way to not have flickering
    const { navigation } = this.props;
    navigation.replace(ScreenName.FallBackCameraScreen);
  }

  render() {
    return null;
  }
}
