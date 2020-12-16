/* @flow */
import { PureComponent } from "react";
import { ScreenName } from "../../const";

export default class FallBackCamera extends PureComponent<{
  navigation: any,
}> {
  componentDidMount() {
    const { navigation } = this.props;
    navigation.replace(ScreenName.FallbackCameraSend);
  }

  render() {
    return null;
  }
}
