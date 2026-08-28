import type { FlatNamespace, i18n } from "i18next";

/**
 * The translation engine injected by the app. Structurally an i18next instance — this package
 * never creates one, it only carries whatever the app root hands it.
 */
export type I18nInstance = i18n;

/**
 * Namespace argument accepted by {@link useTranslation}. Mirrors react-i18next's internal
 * `$Tuple<FlatNamespace>`, which is not reachable through its `exports` map.
 */
export type I18nNamespace = FlatNamespace | readonly [FlatNamespace?, ...FlatNamespace[]];
