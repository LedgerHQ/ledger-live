import { PureComponent } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { setEnvUnsafe } from "@ledgerhq/live-common/env";
import {
  hideEmptyTokenAccountsEnabledSelector,
  filterTokenOperationsZeroAmountEnabledSelector,
} from "../reducers/settings";
import { State } from "../reducers/types";

const mapStateToProps = createStructuredSelector<
  State,
  {
    hideEmptyTokenAccountsEnabled: boolean;
    filterTokenOperationsZeroAmountEnabled: boolean;
  }
>({
  hideEmptyTokenAccountsEnabled: hideEmptyTokenAccountsEnabledSelector,
  filterTokenOperationsZeroAmountEnabled:
    filterTokenOperationsZeroAmountEnabledSelector,
});

class SetEnvsFromSettings extends PureComponent<{
  hideEmptyTokenAccountsEnabled: boolean;
  filterTokenOperationsZeroAmountEnabled: boolean;
}> {
  apply() {
    const {
      hideEmptyTokenAccountsEnabled,
      filterTokenOperationsZeroAmountEnabled,
    } = this.props;
    setEnvUnsafe("HIDE_EMPTY_TOKEN_ACCOUNTS", hideEmptyTokenAccountsEnabled);
    setEnvUnsafe(
      "FILTER_ZERO_AMOUNT_ERC20_EVENTS",
      filterTokenOperationsZeroAmountEnabled,
    );
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
