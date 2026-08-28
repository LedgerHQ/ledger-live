import { useContext } from "react";
import { ThemeContext } from "styled-components/native";
import { resolveThemeVariant, type ThemeVariant } from "./resolveThemeVariant";

/**
 * The active light/dark variant, for the rare component that has to branch in JS rather than in
 * CSS — picking a themed asset, for instance.
 *
 * Reads the context directly rather than through `useTheme`, which throws when no provider is
 * mounted. A component that only needs to pick an asset should stay renderable in isolation (a
 * unit test, a story), so this falls back to `light` instead.
 */
export function useThemeVariant(): ThemeVariant {
  return resolveThemeVariant(useContext(ThemeContext));
}
