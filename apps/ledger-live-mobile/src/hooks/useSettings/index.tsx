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
  locale: string | null | undefined;
  theme: Theme;
  osTheme: SettingsState["osTheme"];
  resolvedTheme: ResolvedTheme;
}

const useSettings = (): UseSettingsResult => {
  // Language & Locale
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);

  // Theme - uses memoized selector from Redux
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
