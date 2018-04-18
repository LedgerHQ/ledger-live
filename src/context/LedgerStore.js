// @flow

import React, { Component } from "react";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import { createStore, applyMiddleware, compose } from "redux";
import dbMiddleware from "../middlewares/db";
import reducers from "../reducers";
import { initAccounts } from "../actions/accounts";
import { initSettings } from "../actions/settings";
import { initCounterValues } from "../actions/counterValues";

const createLedgerStore = () =>
  createStore(
    reducers,
    undefined,
    compose(
      applyMiddleware(thunk, dbMiddleware),
      typeof __REDUX_DEVTOOLS_EXTENSION__ === "function"
        ? __REDUX_DEVTOOLS_EXTENSION__()
        : f => f
    )
  );

export default class LedgerStoreProvider extends Component<
  {
    onInitFinished: () => void,
    children: (ready: boolean) => *
  },
  {
    store: *,
    ready: boolean
  }
> {
  state = {
    store: createLedgerStore(),
    ready: false
  };

  componentDidMount() {
    return this.init();
  }

  componentDidCatch(e: *) {
    console.error(e);
    throw e;
  }

  async init() {
    const { store } = this.state;
    await store.dispatch(initSettings());
    await store.dispatch(initCounterValues());
    await store.dispatch(initAccounts());
    this.setState({ ready: true }, () => {
      this.props.onInitFinished();
    });
  }

  render() {
    const { children } = this.props;
    const { store, ready } = this.state;
    return <Provider store={store}>{children(ready)}</Provider>;
  }
}
