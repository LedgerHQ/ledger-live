// @flow
import React, { Fragment } from "react";
import hoistNonReactStatic from "hoist-non-react-statics";
import db from "../db";

// $FlowFixMe
export const RebootContext = React.createContext(() => {});

export default class RebootProvider extends React.Component<
  {
    onRebootStart?: () => void,
    onRebootEnd?: () => void,
    children: *,
  },
  {
    rebootId: number,
  },
> {
  state = {
    rebootId: 0,
  };

  reboot = async (resetData: boolean = false) => {
    const { onRebootStart, onRebootEnd } = this.props;
    if (onRebootStart) onRebootStart();
    this.setState(state => ({
      rebootId: state.rebootId + 1,
    }));
    if (resetData) {
      await db.delete(["settings", "accounts", "countervalues"]);
    }
    if (onRebootEnd) onRebootEnd();
  };

  render() {
    const { children } = this.props;
    const { rebootId } = this.state;
    return (
      <RebootContext.Provider value={this.reboot}>
        <Fragment key={rebootId}>{children}</Fragment>
      </RebootContext.Provider>
    );
  }
}

// TODO improve flow types
export const withReboot = (Cmp: *) => {
  class WithReboot extends React.Component<*> {
    render() {
      return (
        <RebootContext.Consumer>
          {reboot => <Cmp reboot={reboot} {...this.props} />}
        </RebootContext.Consumer>
      );
    }
  }
  hoistNonReactStatic(WithReboot, Cmp);
  return WithReboot;
};
