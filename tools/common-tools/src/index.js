import React, { Component } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Link, Switch } from "react-router-dom";
import "./index.css";
import Demos from "./demos";

class Dashboard extends Component {
  render() {
    return (
      <div style={{ width: 600, margin: "40px auto" }}>
        <h1>Ledger Live Tools</h1>
        {Object.keys(Demos)
          .filter((key) => !Demos[key].demo.hidden)
          .map((key) => {
            const Demo = Demos[key];
            const { url, title } = Demo.demo;
            return (
              <Link
                key={key}
                to={url}
                style={{
                  display: "block",
                  padding: "0.8em 0",
                  fontSize: "1.6em",
                }}
              >
                {title}
              </Link>
            );
          })}
      </div>
    );
  }
}

const App = () => {
  if (window.location.host === "ledger-live-tools.netlify.com") {
    return (
      <h1>
        {"The tools has moved to: "}
        {window.location.href.replace(
          "ledger-live-tools.netlify.com",
          "ledger-live-tools.now.sh"
        )}
      </h1>
    );
  }
  return (
    <Switch>
      <Route exact path="/" component={Dashboard} />
      {Object.keys(Demos).map((key) => {
        const Demo = Demos[key];
        const { url } = Demo.demo;
        return <Route key={key} path={url} component={Demo} />;
      })}
    </Switch>
  );
};

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("root")
);

// registerServiceWorker();
