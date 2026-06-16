export const resolveCarouselNavigationButtonLabel = (
  navigationButtonLabel: string,
  defaultLabel: string,
): string => {
  const trimmedLabel = navigationButtonLabel.trim();
  return trimmedLabel.length > 0 ? trimmedLabel : defaultLabel;
};
