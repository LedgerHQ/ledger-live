import { system } from "~/renderer/bridge";

export const clipboardMatches = (text: string): Promise<boolean | null> =>
  system.clipboardMatchesText(text);
