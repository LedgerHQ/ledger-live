import { lazy, type ComponentType } from "react";

// Hand-maintained: one entry per coin family that runs an app-wide effect, rendered once for the
// whole app while the user holds an account of the family (e.g. to observe account state changes
// that happen in the background). Each effect is a chunk of its own, so running it on every page
// never loads the family module nor preloads its modals.
const appEffectLoaders: Record<string, () => Promise<{ default: ComponentType }>> = {
  bitcoin: () => import("./bitcoin/appEffect"),
};

const appEffects = new Map(
  Object.entries(appEffectLoaders).map(([family, load]) => [family, lazy(load)]),
);

/** The app-wide effect of a coin family, loaded on first render; undefined when it has none. */
export function getFamilyAppEffect(family: string): ComponentType | undefined {
  return appEffects.get(family);
}
