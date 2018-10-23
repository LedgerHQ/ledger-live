// @flow
import { PureComponent } from "react";

type Props = {
  error: ?Error,
};

class ErrorIcon extends PureComponent<Props> {
  render() {
    const { error } = this.props;
    if (!error) return null;
    if (typeof error !== "object") {
      // this case should not happen (it is supposed to be a ?Error)
      console.error(`ErrorIcon invalid usage: ${String(error)}`);
      return null;
    }
    // TODO map error.name to something
    return null;
  }
}

export default ErrorIcon;
