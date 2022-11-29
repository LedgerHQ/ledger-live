import { PureComponent } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { setEnvUnsafe } from "@ledgerhq/live-common/env";
import { hideEmptyTokenAccountsEnabledSelector } from "../reducers/settings";
import { State } from "../reducers/types";

const mapStateToProps = createStructuredSelector<
  State,
  { hideEmptyTokenAccountsEnabled: boolean }
>({
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

export default connect(mapStateToProps)(SetEnvsFromSettings);
