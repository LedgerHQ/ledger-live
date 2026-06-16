import {
  hasThemedImage,
  resolveThemedImageUrl,
  type ThemedImageUrls,
  type ThemeVariant,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { useTheme } from "styled-components/native";

const toThemeVariant = (theme: string | undefined): ThemeVariant =>
  theme === "dark" ? "dark" : "light";

export const useThemedAwarenessModalImage = (urls: ThemedImageUrls) => {
  const theme = toThemeVariant(useTheme().theme);
  const imageUrl = resolveThemedImageUrl(urls, theme);

  return {
    imageUrl,
    showImage: hasThemedImage(urls, theme),
  };
};
