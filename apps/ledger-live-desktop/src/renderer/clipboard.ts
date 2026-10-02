import { clipboard } from "electron";

export const writeText = (text: string): void => {
  clipboard.writeText(text);
};

export const readText = (): string | null => {
  try {
    return clipboard.readText();
  } catch {
    return null;
  }
};
