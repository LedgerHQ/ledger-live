import { Image } from "react-native";

export async function preloadCardNumbersImage(uri: string): Promise<void> {
  if (typeof Image.prefetch !== "function") {
    return;
  }

  const cached = await Image.prefetch(uri);
  if (!cached) {
    throw new Error("card numbers image failed to preload");
  }
}
