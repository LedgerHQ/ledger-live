// @flow

// this is for react-inspector as they assume your work is legacy
// import "regenerator-runtime/runtime.js";

import "./index.css";
import "./live-common-setup";
import React from "react";
import { log } from "@ledgerhq/logs";
import App from "./components/App";

window._onLedgerLog = (o) => log(o.type, o.message);

if (window && window.navigator.usb) {
  window.navigator.usb.addEventListener("connect", console.log.bind(console));
  window.navigator.usb.addEventListener(
    "disconnect",
    console.log.bind(console)
  );
}

const REPL = () => {
  return <App />;
};

// $FlowFixMe
REPL.demo = {
  title: "REPL",
  url: "/repl",
};

export default REPL;
