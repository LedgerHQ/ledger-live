declare module "react-i18next" {
  declare type TFunction = (key?: ?string, data?: ?Object) => string;

  declare function useTranslation(): { t: TFunction };

  declare function withTranslation(): (
    React$ComponentType<T>,
  ) => React$ComponentType<T & { t: TFunction }>;

  declare type TransProps = {
    count?: number,
    parent?: string,
    i18n?: Object,
    i18nKey?: string,
    t?: TFunction,
  };
  declare var Trans: React$ComponentType<TransProps>;
  declare var initReactI18next: any;
  declare var I18nextProvider: any;
}
