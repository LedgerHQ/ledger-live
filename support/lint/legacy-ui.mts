import { LEGACY_UI_PLUGIN } from "./plugins.mts";

export interface LegacyUiOptions {
  /**
   * The legacy modules. A specifier matches an entry or a subpath of it; an entry starting with `~/` also
   * matches any specifier the app's tsconfig resolves to the same file or folder.
   */
  modules: string[];
  /** Components that reached zero: `no-banned-component` reports any import or JSX element of them. */
  bannedComponents?: string[];
}

/**
 * The `jsPlugins` and `rules` entries that turn the two legacy-ui rules on for an app, with the same options.
 * An app config spreads each key into its own, as it does for `coinFamiliesLint`. The files allowed to keep
 * their legacy imports are listed in `src/legacy-ui-waivers.js`.
 */
export function legacyUiLint(options: LegacyUiOptions) {
  const rule = ["error", options] as ["error", LegacyUiOptions];
  return {
    jsPlugins: [LEGACY_UI_PLUGIN],
    rules: {
      "legacy-ui/no-legacy-import": rule,
      "legacy-ui/no-banned-component": rule,
    },
  };
}
