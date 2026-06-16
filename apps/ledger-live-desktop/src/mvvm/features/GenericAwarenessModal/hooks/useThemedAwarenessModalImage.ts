import {
  hasThemedImage,
  resolveThemedImageUrl,
  type ThemedImageUrls,
  type ThemeVariant,
} from "@ledgerhq/live-common/genericAwarenessModal";
import useTheme from "~/renderer/hooks/useTheme";

const toThemeVariant = (theme: string | undefined): ThemeVariant =>
  theme === "dark" ? "dark" : "light";

export const useThemedAwarenessModalImage = (urls: ThemedImageUrls | undefined) => {
  const theme = toThemeVariant(useTheme().theme);

  if (!urls) {
    return { imageUrl: "", showImage: false };
  }

  const imageUrl = resolveThemedImageUrl(urls, theme);

  return {
    imageUrl,
    showImage: hasThemedImage(urls, theme),
  };
};
