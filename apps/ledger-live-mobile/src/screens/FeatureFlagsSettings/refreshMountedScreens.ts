import { i18n } from "~/context/Locale";

/**
 * Debug only: forces the new copy onto screens mobile navigation keeps mounted, such as Home.
 */
export function refreshMountedScreens(): void {
  i18n.emit("languageChanged", i18n.resolvedLanguage ?? i18n.language);
}
