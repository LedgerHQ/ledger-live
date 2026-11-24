import { COIN_FAMILIES_PLUGIN } from "./plugins.mts";

export interface CoinFamiliesOptions {
  /** The families folder of the app, relative to the app root (for example `src/renderer/families`). */
  familiesDir: string;
  /**
   * `contract`: the folder's entry point is the lazy contract and stays importable (Desktop).
   * `forbidden`: it is eager, so importing it is reported like importing a family (Mobile).
   */
  barrel: "contract" | "forbidden";
  /** Entries of the families folder that stay importable in `contract` mode, by name. */
  allow?: string[];
}

/**
 * The `jsPlugins` and `rules` entries that turn the coin-family rules on for an app. An app config
 * does not extend the base preset, so it spreads each key into its own: `jsPlugins: [..., ...f.jsPlugins]`
 * and `rules: { ..., ...f.rules }`.
 */
export function coinFamiliesLint(options: CoinFamiliesOptions) {
  return {
    jsPlugins: [COIN_FAMILIES_PLUGIN],
    rules: {
      "coin-families/no-coin-specific-import": ["error", options] as ["error", CoinFamiliesOptions],
    },
  };
}
