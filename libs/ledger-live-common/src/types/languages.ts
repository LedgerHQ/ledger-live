export type Language = "french" | "english" | "spanish";

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

export const languageIds: { [key in Language]: number } = {
    english: 0x00,
    french: 0x01,
    spanish: 0x02,
};
