import { system } from "~/renderer/bridge";

/** Single chokepoint for clipboard access, which main performs — see src/main/setup.ts. */
export const writeText = (text: string): void => {
  system.clipboardWriteText(text);
};

/**
 * Callers must distinguish `null` from `""`: an empty string is a genuine clipboard state,
 * `null` means "could not read" and must not be treated as a change.
 */
export const readText = (): Promise<string | null> => system.clipboardReadText();
