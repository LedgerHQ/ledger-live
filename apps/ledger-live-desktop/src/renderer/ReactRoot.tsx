import React, { Component } from "react";
import { AnyAction, Store } from "redux";
import { State as StoreState } from "~/renderer/reducers";
import App from "./App";
import "./global.css";
import { Countervalues } from "./storage";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";

type State = {
  error: unknown;
};
type Props = {
  store: Store<StoreState, AnyAction>;
  language: string;
  initialCountervalues: Countervalues;
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
    const { store, initialCountervalues } = this.props;
    const { error } = this.state;
    return error ? (
      String(error)
    ) : (
      <App store={store} initialCountervalues={initialCountervalues as CounterValuesStateRaw} />
    );
  }
}
export default ReactRoot;
