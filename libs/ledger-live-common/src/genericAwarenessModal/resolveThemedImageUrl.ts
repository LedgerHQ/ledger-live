export type ThemedImageUrls = {
  imageUrlLight: string;
  imageUrlDark: string;
};

export type ThemeVariant = "light" | "dark";

/** Maps a single image URL to themed fields when the same asset is used in light and dark mode. */
export const createThemedImageUrls = (imageUrl: string | undefined): ThemedImageUrls => ({
  imageUrlLight: imageUrl ?? "",
  imageUrlDark: imageUrl ?? "",
});

export const resolveThemedImageUrl = (urls: ThemedImageUrls, theme: ThemeVariant): string => {
  const imageUrlLight = urls.imageUrlLight.trim();
  const imageUrlDark = urls.imageUrlDark.trim();

  if (theme === "dark" && imageUrlDark.length > 0) {
    return imageUrlDark;
  }

  return imageUrlLight;
};

export const hasThemedImage = (urls: ThemedImageUrls, theme: ThemeVariant): boolean =>
  resolveThemedImageUrl(urls, theme).length > 0;
