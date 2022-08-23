import { PureComponent } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { reportErrorsEnabledSelector } from "../reducers/settings";

let enabled = false;
export const getEnabled = (): boolean => enabled;

class HookSentry extends PureComponent<{
  enabled: boolean;
}> {
  componentDidUpdate() {
    this.sync();
  }

  componentDidMount() {
    this.sync();
  }

  sync() {
    enabled = this.props.enabled;
  }

  render() {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
const m: React.ComponentType<{}> = connect(
  createStructuredSelector({
    enabled: reportErrorsEnabledSelector,
  }),
)(HookSentry);
export default m;
