/* @flow */
import { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";

class FallBackCamera extends PureComponent<{
  navigation: NavigationScreenProp<*>,
}> {
  componentDidMount() {
    // TODO do it better way to not have flickering

    const { navigation } = this.props;
    // $FlowFixMe
    navigation.replace("FallBackCameraScreen");
  }

  render() {
    return null;
  }
}

export default FallBackCamera;
