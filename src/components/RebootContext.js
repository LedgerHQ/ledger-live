// @flow
import React from "react";
import hoistNonReactStatic from "hoist-non-react-statics";

// $FlowFixMe
export const RebootContext = React.createContext(() => {});

export class RebootProvider extends React.Component<*, *> {
  render() {
    return (
      <RebootContext.Provider value={this.props.reboot}>
        {this.props.children}
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
