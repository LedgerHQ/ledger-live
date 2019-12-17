import "./live-common-setup";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Link, Switch } from "react-router-dom";
import { getCountervalues } from "@ledgerhq/live-common/lib/countervalues";
import { version } from "@ledgerhq/live-common/package.json";
import "./index.css";
// import registerServiceWorker from "./registerServiceWorker";
import Demos from "./demos";
import { initStore } from "./store";

class Dashboard extends Component {
  render() {
    return (
      <div style={{ width: 600, margin: "40px auto" }}>
        <h1>Ledger Live Tools</h1>
        {Object.keys(Demos)
          .filter(key => !Demos[key].demo.hidden)
          .map(key => {
            const Demo = Demos[key];
            const { url, title } = Demo.demo;
            return (
              <Link
                key={key}
                to={url}
                style={{
                  display: "block",
                  padding: "0.8em 0",
                  fontSize: "1.6em"
                }}
              >
                {title}
              </Link>
            );
          })}
        <footer style={{ paddingTop: 20, fontSize: "1em" }}>
          @ledgerhq/live-common {version}
        </footer>
      </div>
    );
  }
}

class App extends Component<*, *> {
  constructor() {
    super();
    const CounterValues = getCountervalues();
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

    this.state = {
      CounterValues,
      store
    };
  }
  render() {
    const { CounterValues, store } = this.state;
    return (
      <Provider store={store}>
        <CounterValues.PollingProvider>
          <Switch>
            <Route exact path="/" component={Dashboard} />
            {Object.keys(Demos).map(key => {
              const Demo = Demos[key];
              const { url } = Demo.demo;
              return <Route key={key} path={url} component={Demo} />;
            })}
          </Switch>
        </CounterValues.PollingProvider>
      </Provider>
    );
  }
}

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("root")
);

// registerServiceWorker();
