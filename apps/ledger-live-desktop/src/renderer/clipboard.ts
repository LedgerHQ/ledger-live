import { system } from "~/renderer/bridge";

export const writeText = (text: string): void => {
  system.clipboardWriteText(text);
};

export const readText = (): Promise<string | null> => system.clipboardReadText();
