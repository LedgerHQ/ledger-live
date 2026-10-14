import * as ExpoClipboard from "expo-clipboard";

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    return await ExpoClipboard.setStringAsync(text);
  } catch {
    return false;
  }
}

export async function readClipboard(): Promise<string> {
  try {
    return await ExpoClipboard.getStringAsync();
  } catch {
    return "";
  }
}
