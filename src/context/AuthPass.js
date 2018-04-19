// @flow
import { Component } from "react";

export default class AuthPass extends Component<
  {
    enabled?: boolean,
    children: (success: boolean) => *
  },
  {
    success: boolean
  }
> {
  state = {
    success: !this.props.enabled
  };
  componentDidMount() {
    if (!this.state.success) {
      // TODO replace by the actual auth we will do
      setTimeout(() => {
        this.setState({ success: true });
      }, 1000);
    }
  }
  render() {
    const { children } = this.props;
    const { success } = this.state;
    return children(success);
  }
}
