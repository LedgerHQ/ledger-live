/* @flow */
import { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";

class FallBackCamera extends PureComponent<{
  navigation: NavigationScreenProp<*>,
}> {
  componentDidMount() {
    const { navigation } = this.props;
    // $FlowFixMe
    navigation.replace("FallbackCameraSend");
  }

  render() {
    return null;
  }
}

export default FallBackCamera;
