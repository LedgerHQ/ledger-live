export type CarouselActions = {
  logSlideClick: (cardId: string) => void;
  logSlideImpression: (index: number) => void;
  dismissCard: (index: number) => void;
};
