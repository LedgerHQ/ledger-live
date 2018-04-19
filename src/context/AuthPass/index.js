// @flow
import { Component } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { authSecurityEnabledSelector } from "../../reducers/settings";
import biometry from "./methods/biometry";
import passCode from "./methods/passCode"; // eslint-disable-line

const mapStateToProps = createStructuredSelector({
  authSecurityEnabled: authSecurityEnabledSelector
});

type State = {
  pending: boolean,
  success: boolean
};

type Props = {
  authSecurityEnabled: boolean,
  children: State => *
};

const initialState = ({ authSecurityEnabled }: Props): State => {
  return { success: !authSecurityEnabled, pending: authSecurityEnabled };
};

class AuthPass extends Component<Props, State> {
  state = initialState(this.props);

  componentDidMount() {
    if (!this.state.success) {
      this.auth();
    }
  }

  auth = async () => {
    const reason = "Please authenticate to Ledger app";
    const success = (await biometry(reason)) || (await passCode(reason));
    this.setState({ success, pending: false });
  };

  render() {
    const { children } = this.props;
    return children(this.state);
  }
}

export default connect(mapStateToProps)(AuthPass);
