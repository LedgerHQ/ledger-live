// @flow
import React from "react";
import i18next from "i18next";
import hoistNonReactStatic from "hoist-non-react-statics";
import { reactI18nextModule } from "react-i18next";
import Locale from "react-native-locale"; // eslint-disable-line import/no-unresolved
import locales from "../locales";

const languageDetector = {
  type: "languageDetector",
  detect: () => Locale.constants().localeIdentifier.replace("_", "-"),
  init: () => {},
  cacheUserLanguage: () => {}
};

const i18n = i18next
  .use(languageDetector)
  .use(reactI18nextModule)
  .init({
    fallbackLng: "en",
    resources: locales,
    ns: ["common"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false // not needed for react as it does escape per default to prevent xss!
    }
  });

const LocaleContext = React.createContext({
  i18n,
  t: i18n.getFixedT(),
  locale: i18n.language
});

export class LocaleProvider extends React.Component<*, *> {
  state = {
    i18n,
    t: i18n.getFixedT(),
    locale: i18n.language
  };
  componentDidMount() {
    i18next.on("languageChanged", locale => {
      this.setState({
        i18n,
        t: i18n.getFixedT(locale),
        locale: i18n.language
      });
    });
  }
  render() {
    return (
      <LocaleContext.Provider value={this.state}>
        {this.props.children}
      </LocaleContext.Provider>
    );
  }
}

export const withLocale = (Cmp: *) => {
  class WithLocale extends React.Component<*> {
    render() {
      return (
        <LocaleContext.Consumer>
          {val => <Cmp {...val} {...this.props} />}
        </LocaleContext.Consumer>
      );
    }
  }
  hoistNonReactStatic(WithLocale, Cmp);
  return WithLocale;
};
