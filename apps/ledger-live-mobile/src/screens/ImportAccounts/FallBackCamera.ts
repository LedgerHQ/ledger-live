import { CompositeScreenProps } from "@react-navigation/native";
import { PureComponent } from "react";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { ImportAccountsNavigatorParamList } from "../../components/RootNavigator/types/ImportAccountsNavigator";
import { ScreenName } from "../../const";

type NavigationProps = CompositeScreenProps<
  StackNavigatorProps<
    ImportAccountsNavigatorParamList,
    ScreenName.FallBackCameraScreen
  >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default class FallBackCamera extends PureComponent<NavigationProps> {
  componentDidMount() {
    // TODO do it better way to not have flickering
    const { navigation } = this.props;
    navigation.replace(ScreenName.FallBackCameraScreen);
  }

  render() {
    return null;
  }
}
