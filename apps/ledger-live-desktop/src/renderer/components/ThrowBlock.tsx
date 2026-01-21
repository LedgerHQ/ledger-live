import React, { PureComponent } from "react";
import { MemoryRouter } from "react-router";
import logger from "~/renderer/logger";
import RenderError from "./RenderError";
type Props = {
  children: React.ReactNode;
  onError?: (error: Error) => void;
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
      // Wrap RenderError in MemoryRouter because RenderError uses TranslatedError
      // which calls useNavigate() via useErrorLinks hook. ThrowBlock is positioned
      // outside the main Router in App.tsx, so we need to provide a Router context.
      return (
        <MemoryRouter>
          <RenderError error={error} />
        </MemoryRouter>
      );
    }
    return this.props.children;
  }
}
export default ThrowBlock;
