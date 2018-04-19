// @flow
import { Component } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { authSecurityEnabledSelector } from "../../reducers/settings";
import auth from "./auth";

const mapStateToProps = createStructuredSelector({
  authSecurityEnabled: authSecurityEnabledSelector
});

type State = {
  pending: boolean,
  success: boolean,
  error: ?Error
};

type Props = {
  authSecurityEnabled: boolean,
  children: State => *
};

const initialState = ({ authSecurityEnabled }: Props): State => ({
  success: !authSecurityEnabled,
  pending: authSecurityEnabled,
  error: null
});

class AuthPass extends Component<Props, State> {
  state = initialState(this.props);

  componentDidMount() {
    if (!this.state.success) {
      auth("Please authenticate to Ledger app")
        .then(success => this.setState({ success, pending: false }))
        .catch(error =>
          this.setState({ success: false, pending: false, error })
        );
    }
  }

  render() {
    const { children } = this.props;
    return children(this.state);
  }
}

export default connect(mapStateToProps)(AuthPass);
