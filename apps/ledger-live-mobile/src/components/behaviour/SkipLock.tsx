import React, { PureComponent, useContext } from "react";
import { useIsFocused } from "@react-navigation/native";

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const SkipLockContext = React.createContext((_: boolean) => {});

class SkipLockClass extends PureComponent<{
  setEnabled: (_: boolean) => void;
  isFocused: boolean;
}> {
  lastValue = false;

  componentDidMount() {
    this.report(this.props.isFocused);
  }

  componentDidUpdate() {
    this.report(this.props.isFocused);
  }

  componentWillUnmount() {
    this.report(false);
  }

  report = (enabled: boolean) => {
    if (this.lastValue !== enabled) {
      this.props.setEnabled(enabled);
      this.lastValue = enabled;
    }
  };

  render() {
    return null;
  }
}

export default function SkipLock(props: any) {
  const isFocused = useIsFocused();
  const setEnabled = useContext(SkipLockContext);
  return (
    <SkipLockClass {...props} isFocused={isFocused} setEnabled={setEnabled} />
  );
}
