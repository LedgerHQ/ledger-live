// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import LText from "./LText";
import colors from "../colors";
import type { State } from "../reducers";

const mapStateToProps = (state: State) => ({
  colorLocale: state.settings.deltaChangeColorLocale
});

class DeltaChange extends Component<{
  before: number,
  after: number,
  colorLocale: "western" | "eastern",
  style?: {}
}> {
  static defaultProps = { color: true };

  render() {
    const { before, after, colorLocale } = this.props;
    const style = {};

    if (!before) {
      return <LText />;
    }

    const percent: number = after / before * 100 - 100;

    if (colorLocale === "western") {
      style.color = percent >= 0 ? colors.green : colors.red;
    } else if (colorLocale === "eastern") {
      style.color = percent >= 0 ? colors.red : colors.blue;
    }

    return (
      <LText numberOfLines={1} style={[style, this.props.style]}>
        {`${(percent >= 0 ? "+ " : "- ") + Math.abs(percent).toFixed(2)} %`}
      </LText>
    );
  }
}

export default connect(mapStateToProps)(DeltaChange);
