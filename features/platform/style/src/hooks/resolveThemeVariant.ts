export type ThemeVariant = "light" | "dark";

/**
 * Narrows a styled-components theme to its light/dark variant. The apps declare `theme` through a
 * `DefaultTheme` module augmentation that isn't visible from here, and styled-components returns
 * undefined when no provider is mounted, so both are handled defensively.
 */
export function resolveThemeVariant(theme: unknown): ThemeVariant {
  return (theme as { theme?: unknown } | undefined)?.theme === "dark" ? "dark" : "light";
}
