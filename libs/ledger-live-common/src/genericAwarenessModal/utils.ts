import type { GenericAwarenessModalContentCard } from "./types";

export const hasAwarenessModalActionButton = (label: string, _link: string): boolean =>
  label.trim().length > 0;

export const resolveAwarenessModalActionLink = (link: string): string | undefined => {
  const trimmedLink = link.trim();
  return trimmedLink.length > 0 ? trimmedLink : undefined;
};

export const hasAwarenessModalActionLink = (link: string): boolean =>
  resolveAwarenessModalActionLink(link) !== undefined;

export const resolveCarouselNavigationButtonLabel = (
  navigationButtonLabel: string,
  defaultLabel: string,
): string => {
  const trimmedLabel = navigationButtonLabel.trim();
  return trimmedLabel.length > 0 ? trimmedLabel : defaultLabel;
};

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

/**
 * Gets a content card by its id. If not provided, the first app start card is returned.
 */
export function getGenericAwarenessModalContentCard(
  contentCards: readonly GenericAwarenessModalContentCard[],
  id?: string,
): GenericAwarenessModalContentCard | undefined {
  return contentCards.find(card => {
    if (!id) {
      return card.id.startsWith("APP_START");
    }
    return card.id === id;
  });
}
