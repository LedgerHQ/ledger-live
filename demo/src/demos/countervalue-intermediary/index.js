import React from "react";
import { Provider } from "react-redux";
import { initStore } from "./store";
import App from "./components/App";
import CounterValues from "./countervalues";

const store = initStore();

// quick way to store countervalues with localStorage
const LS_KEY = "countervalues_intermediary";
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

const Demo = () => (
  <Provider store={store}>
    <CounterValues.PollingProvider>
      <App />
    </CounterValues.PollingProvider>
  </Provider>
);

Demo.demo = {
  title: "Intermediary Countervalue",
  url: "/countervalues/intermediary"
};

export default Demo;
