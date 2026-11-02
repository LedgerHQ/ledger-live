export type OpenExternal = (url: string) => void | Promise<void>;

export type LocalizationConfig = {
  currentLanguage: string;
  defaultLanguage: string;
  languages: Record<string, string>;
};

export type OpenLinkOptions = Readonly<{ sensitive?: boolean }>;

export type OpenLink = (url: string, options?: OpenLinkOptions) => void;

export type LinkingConfig = {
  openExternal: OpenExternal;
  onLinkOpened?: (url: string) => void;
  localization?: LocalizationConfig;
};
