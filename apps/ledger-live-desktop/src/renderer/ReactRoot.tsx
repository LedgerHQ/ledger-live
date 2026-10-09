import React, { Component } from "react";
import { UnknownAction, Store } from "redux";
import { State as StoreState } from "~/renderer/reducers";
import App from "./App";
import "./global.css";

type State = {
  error: unknown;
};
type Props = {
  store: Store<StoreState, UnknownAction>;
  language: string;
};
class ReactRoot extends Component<Props, State> {
  state = {
    error: null,
  };

  componentDidCatch(error: unknown) {
    this.setState({
      error,
    });
  }

  render() {
    const { store } = this.props;
    const { error } = this.state;
    return error ? String(error) : <App store={store} />;
  }
}
export default ReactRoot;
