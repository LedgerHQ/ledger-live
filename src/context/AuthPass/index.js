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
  success: boolean
};

type Props = {
  authSecurityEnabled: boolean,
  children: State => *
};

const initialState = ({ authSecurityEnabled }: Props): State => ({
  success: !authSecurityEnabled,
  pending: authSecurityEnabled
});

class AuthPass extends Component<Props, State> {
  state = initialState(this.props);

  componentDidMount() {
    if (!this.state.success) {
      this.auth();
    }
  }

  auth = async () => {
    try {
      const success = await auth();
      this.setState({ success, pending: false });
    } catch (e) {
      console.warn(e);
      this.setState({ success: false, pending: false });
    }
  };

  render() {
    const { children } = this.props;
    return children(this.state);
  }
}

export default connect(mapStateToProps)(AuthPass);
