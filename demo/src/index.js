import "babel-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./index.css";
import registerServiceWorker from "./registerServiceWorker";
import { initStore } from "./store";
import App from "./components/App";
import CounterValues from "./countervalues";

const store = initStore();

// quick way to store countervalues with localStorage
const LS_KEY = "countervalues";
try {
  const json = localStorage.getItem(LS_KEY);
  if (json) {
    store.dispatch(CounterValues.importAction(JSON.parse(json)));
  }
} catch (e) {
  console.warn(e);
}
store.subscribe(() => {
  localStorage.setItem(
    LS_KEY,
    JSON.stringify(CounterValues.exportSelector(store.getState()))
  );
});

ReactDOM.render(
  <Provider store={store}>
    <CounterValues.PollingProvider>
      <App />
    </CounterValues.PollingProvider>
  </Provider>,
  document.getElementById("root")
);
registerServiceWorker();
