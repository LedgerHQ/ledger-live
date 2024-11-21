export type CarouselActions = {
  logSlideClick: (cardId: string) => void;
  logSlideImpression: (current: number, previous?: number) => void;
  dismissCard: (index: number) => void;
};
