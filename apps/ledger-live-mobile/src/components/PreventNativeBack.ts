import { PureComponent } from "react";
import { BackHandler, NativeEventSubscription } from "react-native";

// eslint-disable-next-line @typescript-eslint/ban-types
class PreventNativeBack extends PureComponent<{}> {
  removeBoundEventListener: NativeEventSubscription | undefined;

  componentDidMount() {
    this.removeBoundEventListener = BackHandler.addEventListener("hardwareBackPress", () => true);
  }

  componentWillUnmount() {
    this.removeBoundEventListener?.remove();
    this.removeBoundEventListener = undefined;
  }

  render() {
    return null;
  }
}

export default PreventNativeBack;
