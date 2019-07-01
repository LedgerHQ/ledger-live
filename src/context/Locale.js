// @flow
import React, { Component } from "react";
import i18next from "i18next";
import hoistNonReactStatic from "hoist-non-react-statics";
import { reactI18nextModule } from "react-i18next";
import Locale from "react-native-locale";
import { locales } from "../languages";

export type TranslateFunction = (string, ?Object) => string;

const languageDetector = {
  type: "languageDetector",
  detect: () => {
    const { localeIdentifier, preferredLanguages } = Locale.constants();
    const locale =
      (preferredLanguages && preferredLanguages[0]) || localeIdentifier;
    const matches = locale.match(/([a-z]{2,4}[-_]([A-Z]{2,4}|[0-9]{3}))/);
    const lang = (matches && matches[1].replace("_", "-")) || "en-US";
    console.log("Language detected is " + lang); // eslint-disable-line no-console
    return lang;
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

const i18n = i18next
  .use(languageDetector)
  .use(reactI18nextModule)
  .init({
    fallbackLng: "en",
    resources: locales,
    whitelist: Object.keys(locales),
    ns: ["common"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // not needed for react as it does escape per default to prevent xss!
    },
  });

const getState = i18n => ({
  i18n,
  t: i18n.getFixedT(),
  locale: i18n.languages[0],
});

// $FlowFixMe
const LocaleContext = React.createContext(getState(i18n));

type State = {
  i18n: *,
  t: TranslateFunction,
  locale: string,
};

export default class LocaleProvider extends React.Component<
  {
    children: *,
  },
  State,
> {
  state = getState(i18n);

  componentDidMount() {
    i18next.on("languageChanged", () => {
      this.setState(getState(i18n));
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

export const withLocale = (
  Cmp: React$ComponentType<*>,
): React$ComponentType<*> => {
  class WithLocale extends Component<*> {
    render() {
      return (
        <LocaleContext.Consumer>
          {(val: State) => <Cmp {...this.props} {...val} />}
        </LocaleContext.Consumer>
      );
    }
  }
  WithLocale.displayName = `withLocale(${Cmp.displayName ||
    Cmp.name ||
    "Component"})`;
  hoistNonReactStatic(WithLocale, Cmp);
  return WithLocale;
};
