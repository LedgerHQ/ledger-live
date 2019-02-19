// @flow
import React, { PureComponent } from "react";
import { withNavigationFocus } from "react-navigation";

export const SkipLockContext = React.createContext({
  skipLockCount: 0,
  setEnabled: (_: boolean) => {},
});

class SkipLock extends PureComponent<*> {
  render() {
    return (
      <SkipLockContext.Consumer>
        {context => (
          <SkipLockInner setEnabled={context.setEnabled} {...this.props} />
        )}
      </SkipLockContext.Consumer>
    );
  }
}

class SkipLockInner extends PureComponent<{
  setEnabled: (enabled: boolean) => void,
  isFocused: boolean,
}> {
  lastValue = false;

  componentDidMount() {
    this.report(true);
  }

  componentDidUpdate() {
    this.report(this.props.isFocused);
  }

  componentWillUnmount() {
    this.report(false);
  }

  report = enabled => {
    if (this.lastValue !== enabled) {
      this.props.setEnabled(enabled);
      this.lastValue = enabled;
    }
  };

  render() {
    return null;
  }
}

export default withNavigationFocus(SkipLock);
