// @flow
import { PureComponent } from "react";
import { withNavigationFocus } from "react-navigation";
import { screen } from "./segment";

class TrackScreen extends PureComponent<{
  category: string,
  name?: string,
  isFocused: boolean,
}> {
  componentDidMount() {
    if (this.props.isFocused) {
      this.record();
    }
  }
  componentDidUpdate(prev) {
    if (!prev.isFocused && this.props.isFocused) {
      this.record();
    }
  }
  record() {
    const { category, name, isFocused, ...properties } = this.props;
    // $FlowFixMe
    delete properties.navigation;
    screen(category, name, properties);
  }
  render() {
    return null;
  }
}

export default withNavigationFocus(TrackScreen);
