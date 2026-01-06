import { useSelector } from "~/context/store";
import {
  languageSelector,
  localeSelector,
  themeSelector,
  osThemeSelector,
  resolvedThemeSelector,
} from "~/reducers/settings";
import type { SettingsState, Theme } from "~/reducers/types";

type ResolvedTheme = "light" | "dark";

interface UseSettingsResult {
  language: string;
  locale: string;
  theme: Theme;
  osTheme: SettingsState["osTheme"];
  resolvedTheme: ResolvedTheme;
}

const useSettings = (): UseSettingsResult => {
  // Language & Locale
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);

  // Theme
  const theme = useSelector(themeSelector);
  const osTheme = useSelector(osThemeSelector);
  const resolvedTheme = useSelector(resolvedThemeSelector);

  return {
    language,
    locale,
    theme,
    osTheme,
    resolvedTheme,
  };
};

export default useSettings;
