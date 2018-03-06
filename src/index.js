//@flow
import "./polyfill";
import React, { Component } from "react";
import { translate } from "react-i18next";
import { NativeModules } from "react-native";
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
