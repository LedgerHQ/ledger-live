/* @flow */
import { PureComponent } from "react";
import { ScreenName } from "../../const";

export default class FallBackCamera extends PureComponent<{
  navigation: any,
}> {
  componentDidMount() {
    // TODO do it better way to not have flickering
    const { navigation } = this.props;
    navigation.replace(ScreenName.FallBackCameraScreen);
  }

  render() {
    return null;
  }
}
