import { PureComponent } from "react";
import { connect } from "react-redux";
import { NetInfo } from "react-native";
import { syncIsConnected } from "../actions/appstate";

// goal: hook to global app state events to sync with appstate store
class AppStateListener extends PureComponent<{
  syncIsConnected: boolean => *,
}> {
  componentDidMount() {
    NetInfo.isConnected.fetch().then(this.sync);
    NetInfo.isConnected.addEventListener("connectionChange", this.sync);
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener("connectionChange", this.sync);
  }

  isConnected = true;

  sync = isConnected => {
    this.props.syncIsConnected(isConnected);
  };

  render() {
    return null;
  }
}

export default connect(
  null,
  { syncIsConnected },
)(AppStateListener);
