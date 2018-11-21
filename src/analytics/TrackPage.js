// @flow
import { PureComponent } from "react";
import { withNavigationFocus } from "react-navigation";
import { page } from "./segment";

class TrackPage extends PureComponent<{
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
    const { category, name, ...properties } = this.props;
    page(category, name, properties);
  }
  render() {
    return null;
  }
}

export default withNavigationFocus(TrackPage);
