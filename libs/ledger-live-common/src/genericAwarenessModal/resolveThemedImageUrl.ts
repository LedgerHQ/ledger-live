export type ThemedImageUrls = {
  imageUrlLight: string;
  imageUrlDark: string;
};

export type ThemeVariant = "light" | "dark";

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
