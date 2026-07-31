import electron from "electron";

/**
 * Single chokepoint for clipboard access from the renderer.
 *
 * Keeping every call site behind this module means the underlying implementation can
 * be swapped (Electron's `clipboard` today, a `navigator.clipboard` / bridge call once
 * the renderer is context-isolated) without touching consumers. It also centralises the
 * Storybook guard, which previously lived inline at each call site as a lazy
 * `require("electron")` — a pattern no lint rule can detect.
 */
let clipboard: Electron.Clipboard | undefined;
if (!process.env.STORYBOOK_ENV) {
  clipboard = electron.clipboard;
}

export const writeText = (text: string): void => {
  clipboard?.writeText(text);
};

/**
 * Returns the clipboard's current text, or `null` when the clipboard is unavailable
 * (Storybook). Callers must distinguish `null` from `""`: an empty string is a genuine
 * clipboard state, whereas `null` means "could not read" and should not be treated as a
 * change.
 */
export const readText = (): string | null => (clipboard ? clipboard.readText() : null);
