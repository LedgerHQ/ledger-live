import React from "react";
import logo from "./ledger-logo.png";

const prettyJSON = (payload: any) => JSON.stringify(payload, null, 2);

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h3>Ledger Live Dummy Test App</h3>
        <p>App for testing the Buy app query parameters in Automated tests</p>
        <pre className="output-container">Hello</pre>
      </header>
    </div>
  );
};

export default App;
