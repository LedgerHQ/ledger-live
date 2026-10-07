import { clipboard } from "electron";

export const readText = (): string | null => {
  try {
    return clipboard.readText();
  } catch {
    return null;
  }
};
