// @flow

import "./polyfill";

import React, { Component } from "react"; // eslint-disable-line import/first

import App from "./App";
import { LocaleProvider } from "./components/LocaleContext";

export default class Root extends Component<{}> {
  render() {
    return (
      <LocaleProvider>
        <App />
      </LocaleProvider>
    );
  }
}
