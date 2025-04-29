export type Language =
  | "french"
  | "english"
  | "spanish"
  | "brazilian"
  | "german"
  | "russian"
  | "turkish"
  | "thai";

export type LanguagePackage = {
  language: Language;
  languagePackageVersionId: number;
  version: string; // "0.0.1"
  language_package_id: number;
  apdu_install_url: string;
  apdu_uninstall_url: string; // <= Useless
  device_versions: number[];
  se_firmware_final_versions: number[];
  bytes: number;
  date_creation: string;
  date_last_modified: string;
};

export type LanguagePackageResponse = {
  id: number;
  language: Language;
  language_package_version: LanguagePackage[];
};

export const languageIds: { [key in Language]: number } = {
  english: 0x00,
  french: 0x01,
  spanish: 0x02,
  brazilian: 0x03,
  german: 0x04,
  russian: 0x05,
  turkish: 0x06,
  thai: 0x07,
};

export const idsToLanguage: {
  [key in (typeof languageIds)[Language]]: Language;
} = {
  0x00: "english",
  0x01: "french",
  0x02: "spanish",
  0x03: "brazilian",
  0x04: "german",
  0x05: "russian",
  0x06: "turkish",
  0x07: "thai",
};
