// @flow

import { PureComponent } from "react";
import { connect } from "react-redux";
import { refreshAccountsOrdering } from "../actions/general";

const mapStateToProps = null;

const mapDispatchToProps = {
  refreshAccountsOrdering,
};

class RefreshAccountsOrdering extends PureComponent<{
  refreshAccountsOrdering: () => *,
  onMount?: boolean,
  onUnmount?: boolean,
  onUpdate?: boolean,
}> {
  componentDidMount() {
    if (this.props.onMount) {
      this.props.refreshAccountsOrdering();
    }
  }

  componentDidUpdate() {
    if (this.props.onUpdate) {
      this.props.refreshAccountsOrdering();
    }
  }

  componentWillUnmount() {
    if (this.props.onUnmount) {
      this.props.refreshAccountsOrdering();
    }
  }

  render() {
    return null;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RefreshAccountsOrdering);
