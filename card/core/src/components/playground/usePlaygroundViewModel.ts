import type { PlaygroundViewProps } from "./types";

// Static demo data — replace with a real source (@shared/* selector, useSelector, RTK Query) without touching the View.
export function usePlaygroundViewModel(): PlaygroundViewProps {
  return {
    title: "Card Playground",
    description:
      "Sample Card component in MVVM form. Duplicate this folder under card/core/src/components/ and add a registry entry in src/registry.ts to add your own.",
  };
}
