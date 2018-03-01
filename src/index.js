//@flow
import "./polyfill";
import React, { Component } from "react";
import { translate } from "react-i18next";
import { NativeModules } from "react-native";
import App from "./App";
import i18n from "./i18n";

const WrappedApp = () => <App t={i18n.getFixedT()} />;

const ReloadAppOnLanguageChange = translate("common", {
  bindI18n: "languageChanged",
  bindStore: false
})(WrappedApp);

export default class Root extends Component<{}> {
  render() {
    return <ReloadAppOnLanguageChange />;
  }
}
