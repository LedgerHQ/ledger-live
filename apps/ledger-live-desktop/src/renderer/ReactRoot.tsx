import React, { Component } from "react";
import { UnknownAction, Store } from "redux";
import { State as StoreState } from "~/renderer/reducers";
import { CountervaluesProbeProfiler } from "@features/platform-market-countervalues";
import App from "./App";
import "./global.css";
import { Countervalues } from "./storage";
import { CounterValuesStateRaw } from "@domain/entity-market-countervalues";

type State = {
  error: unknown;
};
type Props = {
  store: Store<StoreState, UnknownAction>;
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
      <CountervaluesProbeProfiler>
        <App store={store} initialCountervalues={initialCountervalues as CounterValuesStateRaw} />
      </CountervaluesProbeProfiler>
    );
  }
}
export default ReactRoot;
