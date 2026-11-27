import { LEGACY_UI_PLUGIN } from "./plugins.mts";

export interface LegacyUiOptions {
  /**
   * The legacy modules. A specifier matches an entry or a subpath of it; an entry starting with `~/` also
   * matches any specifier the app's tsconfig resolves to the same file or folder.
   */
  modules: string[];
  /**
   * Files no rule checks, as globs relative to the app root. `reason` names the feature flag whose cleanup
   * deletes them, or `dev-only`.
   */
  exemptPaths?: { glob: string; reason: string }[];
  /** Components that reached zero: `no-banned-component` reports any import or JSX element of them. */
  bannedComponents?: string[];
}

/**
 * The `jsPlugins` and `rules` entries that turn the four legacy-ui rules on for an app, all with the same
 * options. An app config spreads each key into its own, as it does for `coinFamiliesLint`.
 */
export function legacyUiLint(options: LegacyUiOptions) {
  const rule = ["error", options] as ["error", LegacyUiOptions];
  return {
    jsPlugins: [LEGACY_UI_PLUGIN],
    rules: {
      "legacy-ui/no-legacy-import": rule,
      "legacy-ui/no-legacy-element": rule,
      "legacy-ui/no-styled-definition": rule,
      "legacy-ui/no-banned-component": rule,
    },
  };
}
