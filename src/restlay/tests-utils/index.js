//@flow
import React, { Component } from "react";
import { Provider } from "react-redux";
import { createStore, applyMiddleware, combineReducers } from "redux";
import thunk from "redux-thunk";
import RestlayProvider from "../RestlayProvider";
import { reducer } from "../dataStore";
import type { NetworkF } from "../RestlayProvider";

export const delay = (ms: number): Promise<any> =>
  new Promise(success => setTimeout(success, ms));

export class NullComponent extends Component<{}> {
  render() {
    return null;
  }
}

export function flushPromises(): Promise<any> {
  return new Promise(resolve => setImmediate(resolve));
}

export const newStore = () =>
  createStore(
    combineReducers({
      data: reducer
    }),
    applyMiddleware(thunk)
  );

export const createRender = (
  network: NetworkF,
  connectDataOptDefaults?: Object,
  store?: * = newStore()
) => {
  const render = (children: React$Node) => (
    <Provider store={store}>
      <RestlayProvider
        network={network}
        connectDataOptDefaults={connectDataOptDefaults}
      >
        {children}
      </RestlayProvider>
    </Provider>
  );
  return render;
};

export const defer = () => {
  let resolve: () => void, reject: () => void;
  const promise: Promise<any> = new Promise((success, failure) => {
    resolve = success;
    reject = failure;
  });
  if (!resolve || !reject) throw new Error(); // never happen, to satisfy flow
  return { resolve, reject, promise };
};

// returns {network,tick}
// network function: can be passed to createRender
// tick function: needs to be called to redeem pending network calls. (also returns number of waiters)
// tickOne function: redeem only one pending network call and returns number of calls (0 or 1)
// countTickWaiters function: gets the number of network call awaiting
export const networkFromMock = (mock: {
  networkSync: Function
}): {
  network: NetworkF,
  tick: () => number,
  tickOne: () => number,
  countTickWaiters: () => number
} => {
  let tickDefers = [];
  const waitTick = () => {
    const d = defer();
    tickDefers.push(d);
    return d.promise.then(() => {
      const i = tickDefers.indexOf(d);
      if (i !== -1) tickDefers.splice(i, 1);
    });
  };
  return {
    tickOne: () => {
      if (tickDefers.length === 0) return 0;
      const [tickD] = tickDefers.splice(0, 1);
      tickD.resolve();
      return 1;
    },
    tick: () => {
      const nb = tickDefers.length;
      tickDefers.forEach(tickD => {
        tickD.resolve();
        tickD = defer();
      });
      return nb;
    },
    countTickWaiters: () => tickDefers.length,
    network: (uri, method, body) =>
      waitTick().then(() => mock.networkSync(uri, method, body))
  };
};
