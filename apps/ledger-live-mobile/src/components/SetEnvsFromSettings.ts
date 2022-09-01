import { PureComponent } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { setEnvUnsafe } from "@ledgerhq/live-common/env";
import { hideEmptyTokenAccountsEnabledSelector } from "../reducers/settings";

const mapStateToProps = createStructuredSelector({
  hideEmptyTokenAccountsEnabled: hideEmptyTokenAccountsEnabledSelector,
});

class SetEnvsFromSettings extends PureComponent<{
  hideEmptyTokenAccountsEnabled: boolean;
}> {
  apply() {
    const { hideEmptyTokenAccountsEnabled } = this.props;
    setEnvUnsafe("HIDE_EMPTY_TOKEN_ACCOUNTS", hideEmptyTokenAccountsEnabled);
  }

  componentDidMount() {
    this.apply();
  }

  componentDidUpdate() {
    this.apply();
  }

  render() {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
const m: React.ComponentType<{}> =
  connect(mapStateToProps)(SetEnvsFromSettings);
export default m;
