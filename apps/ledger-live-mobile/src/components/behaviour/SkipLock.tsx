import React, { PureComponent, useContext } from "react";
import { useIsFocused } from "@react-navigation/native";

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const SkipLockContext = React.createContext((_: boolean) => {});

type Props = {
  setEnabled: (_: boolean) => void;
  isFocused: boolean;
};

class SkipLockClass extends PureComponent<Props> {
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

export default function SkipLock() {
  const isFocused = useIsFocused();
  const setEnabled = useContext(SkipLockContext);
  return <SkipLockClass isFocused={isFocused} setEnabled={setEnabled} />;
}
