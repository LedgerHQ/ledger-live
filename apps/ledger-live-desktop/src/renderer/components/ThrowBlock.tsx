import React, { PureComponent } from "react";
import logger from "~/renderer/logger";
import RenderError from "./RenderError";
type Props = {
  children: any;
  onError?: Function;
};
type State = {
  error: Error | undefined | null;
};
class ThrowBlock extends PureComponent<Props, State> {
  state = {
    error: null,
  };

  componentDidCatch(error: Error) {
    logger.critical(error);
    this.setState({
      error,
    });
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    const { error } = this.state;
    if (error) {
      return <RenderError error={error} />;
    }
    return this.props.children;
  }
}
export default ThrowBlock;
